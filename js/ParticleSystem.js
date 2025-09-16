/**
 * 粒子系统 - 气流可视化
 * 负责创建和管理气流粒子，模拟大气运动
 */

class ParticleSystem {
    constructor(scene, thermalSystem, params = {}) {
        this.scene = scene;
        this.thermalSystem = thermalSystem;
        this.params = {
            maxParticles: params.maxParticles || 1000,
            particleSize: params.particleSize || 5,
            particleSpeed: params.particleSpeed || 1,
            ...params
        };
        
        this.particles = [];
        this.particleMesh = null;
        this.positions = null;
        this.colors = null;
        this.velocities = [];
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.createParticleSystem();
    }
    
    createParticleSystem() {
        const geometry = new THREE.BufferGeometry();
        
        // 创建粒子属性数组
        this.positions = new Float32Array(this.params.maxParticles * 3);
        this.colors = new Float32Array(this.params.maxParticles * 3);
        this.sizes = new Float32Array(this.params.maxParticles);
        
        // 初始化粒子
        for (let i = 0; i < this.params.maxParticles; i++) {
            this.initializeParticle(i);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        
        // 创建粒子材质
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - dist * 2.0;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particleMesh = new THREE.Points(geometry, material);
        this.scene.add(this.particleMesh);
    }
    
    initializeParticle(index) {
        const i3 = index * 3;
        
        // 随机初始位置
        const x = (Math.random() - 0.5) * 4000;
        const y = Math.random() * 2000;
        const z = (Math.random() - 0.5) * 1000;
        
        this.positions[i3] = x;
        this.positions[i3 + 1] = y;
        this.positions[i3 + 2] = z;
        
        // 基于位置的温度颜色
        const temp = this.thermalSystem.getTemperatureAt(x, y, z);
        const color = this.temperatureToParticleColor(temp);
        
        this.colors[i3] = color.r;
        this.colors[i3 + 1] = color.g;
        this.colors[i3 + 2] = color.b;
        
        this.sizes[index] = this.params.particleSize;
        
        // 初始速度
        this.velocities[index] = new THREE.Vector3(0, 0, 0);
    }
    
    temperatureToParticleColor(temperature) {
        const minTemp = -10;
        const maxTemp = 40;
        const normalized = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));
        
        // 温度到颜色的映射（蓝色到红色）
        const hue = (1 - normalized) * 240 / 360; // 蓝色到红色
        const color = new THREE.Color();
        color.setHSL(hue, 0.8, 0.6);
        return color;
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        const speedMultiplier = this.params.particleSpeed;
        
        for (let i = 0; i < this.params.maxParticles; i++) {
            this.updateParticle(i, deltaTime * speedMultiplier);
        }
        
        // 更新缓冲区
        this.particleMesh.geometry.attributes.position.needsUpdate = true;
        this.particleMesh.geometry.attributes.color.needsUpdate = true;
        
        // 更新时间uniform
        if (this.particleMesh.material.uniforms) {
            this.particleMesh.material.uniforms.time.value += deltaTime;
        }
    }
    
    updateParticle(index, deltaTime) {
        const i3 = index * 3;
        
        // 获取当前位置
        const x = this.positions[i3];
        const y = this.positions[i3 + 1];
        const z = this.positions[i3 + 2];
        
        // 获取风速向量
        const windVector = this.thermalSystem.getWindVectorAt(x, y, z);
        
        // 添加浮力效应（热空气上升，冷空气下降）
        const temperature = this.thermalSystem.getTemperatureAt(x, y, z);
        const baseTemperature = 20;
        const buoyancyForce = (temperature - baseTemperature) * 0.001;
        
        // 更新速度
        const velocity = this.velocities[index];
        velocity.add(windVector.clone().multiplyScalar(deltaTime));
        velocity.y += buoyancyForce * deltaTime;
        
        // 添加阻力
        velocity.multiplyScalar(0.98);
        
        // 限制最大速度
        const maxSpeed = 20;
        if (velocity.length() > maxSpeed) {
            velocity.normalize().multiplyScalar(maxSpeed);
        }
        
        // 更新位置
        this.positions[i3] += velocity.x * deltaTime;
        this.positions[i3 + 1] += velocity.y * deltaTime;
        this.positions[i3 + 2] += velocity.z * deltaTime;
        
        // 边界检查和重置
        this.checkBoundaries(index);
        
        // 更新粒子颜色
        const temp = this.thermalSystem.getTemperatureAt(
            this.positions[i3], 
            this.positions[i3 + 1], 
            this.positions[i3 + 2]
        );
        const color = this.temperatureToParticleColor(temp);
        
        this.colors[i3] = color.r;
        this.colors[i3 + 1] = color.g;
        this.colors[i3 + 2] = color.b;
    }
    
    checkBoundaries(index) {
        const i3 = index * 3;
        const x = this.positions[i3];
        const y = this.positions[i3 + 1];
        const z = this.positions[i3 + 2];
        
        let needsReset = false;
        
        // 检查边界
        if (Math.abs(x) > 2000 || y < 0 || y > 2000 || Math.abs(z) > 500) {
            needsReset = true;
        }
        
        // 如果粒子离开场景，重新初始化
        if (needsReset) {
            this.initializeParticle(index);
        }
    }
    
    start() {
        this.isActive = true;
    }
    
    pause() {
        this.isActive = false;
    }
    
    reset() {
        this.pause();
        for (let i = 0; i < this.params.maxParticles; i++) {
            this.initializeParticle(i);
        }
        this.particleMesh.geometry.attributes.position.needsUpdate = true;
        this.particleMesh.geometry.attributes.color.needsUpdate = true;
    }
    
    setSpeed(speed) {
        this.params.particleSpeed = Math.max(0.1, Math.min(3, speed));
    }
    
    setParticleCount(count) {
        const newCount = Math.max(100, Math.min(2000, count));
        this.params.maxParticles = newCount;
        
        // 重新创建粒子系统
        this.dispose();
        this.init();
    }
    
    toggleVisibility(visible) {
        if (this.particleMesh) {
            this.particleMesh.visible = visible;
        }
    }
    
    // 创建风向箭头可视化
    createWindArrows() {
        this.windArrows = [];
        const arrowGroup = new THREE.Group();
        
        const spacing = 400;
        const levels = [500, 1000, 1500];
        
        levels.forEach(level => {
            for (let x = -1500; x <= 1500; x += spacing) {
                for (let z = -300; z <= 300; z += spacing) {
                    const windVector = this.thermalSystem.getWindVectorAt(x, level, z);
                    
                    if (windVector.length() > 0.1) {
                        const arrow = this.createArrow(windVector, x, level, z);
                        arrowGroup.add(arrow);
                        this.windArrows.push(arrow);
                    }
                }
            }
        });
        
        this.scene.add(arrowGroup);
        this.windArrowGroup = arrowGroup;
    }
    
    createArrow(vector, x, y, z) {
        const length = Math.min(vector.length() * 50, 100);
        const direction = vector.clone().normalize();
        
        const arrowGeometry = new THREE.CylinderGeometry(0, 5, length, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });
        
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(x, y, z);
        
        // 设置箭头方向
        arrow.lookAt(
            x + direction.x * length,
            y + direction.y * length,
            z + direction.z * length
        );
        
        arrow.rotateX(Math.PI / 2);
        
        return arrow;
    }
    
    updateWindArrows() {
        if (!this.windArrows) return;
        
        this.windArrows.forEach(arrow => {
            const pos = arrow.position;
            const windVector = this.thermalSystem.getWindVectorAt(pos.x, pos.y, pos.z);
            
            const length = Math.min(windVector.length() * 50, 100);
            const direction = windVector.clone().normalize();
            
            // 更新箭头长度和方向
            arrow.scale.y = length / 100;
            arrow.lookAt(
                pos.x + direction.x * length,
                pos.y + direction.y * length,
                pos.z + direction.z * length
            );
            arrow.rotateX(Math.PI / 2);
        });
    }
    
    toggleWindArrows(visible) {
        if (this.windArrowGroup) {
            this.windArrowGroup.visible = visible;
        }
    }
    
    dispose() {
        if (this.particleMesh) {
            this.scene.remove(this.particleMesh);
            this.particleMesh.geometry.dispose();
            this.particleMesh.material.dispose();
        }
        
        if (this.windArrowGroup) {
            this.scene.remove(this.windArrowGroup);
            this.windArrows.forEach(arrow => {
                arrow.geometry.dispose();
                arrow.material.dispose();
            });
        }
    }
    
    getStats() {
        return {
            particleCount: this.params.maxParticles,
            activeParticles: this.particles.length,
            averageVelocity: this.velocities.reduce((sum, v) => sum + v.length(), 0) / this.velocities.length
        };
    }
}

// 导出供其他模块使用
window.ParticleSystem = ParticleSystem;