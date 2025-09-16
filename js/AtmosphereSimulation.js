/**
 * 大气热力环流模拟系统 - 核心场景类
 * 负责Three.js场景初始化、渲染循环和基础场景设置
 */

class AtmosphereSimulation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        
        // 场景参数
        this.sceneParams = {
            width: 4000,
            depth: 1000,
            height: 2000
        };
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLighting();
        this.createBoundaries();
        this.setupControls();
        this.startRenderLoop();
        
        // 响应窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff); // 白色背景
        this.scene.fog = new THREE.Fog(0xffffff, 1000, 5000);
    }
    
    createCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
        
        // 设置相机初始位置（自由视角）
        this.camera.position.set(2500, 1500, 2500);
        this.camera.lookAt(0, 500, 0);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    createLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 主光源（模拟太阳）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1000, 2000, 1000);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 5000;
        directionalLight.shadow.camera.left = -2000;
        directionalLight.shadow.camera.right = 2000;
        directionalLight.shadow.camera.top = 2000;
        directionalLight.shadow.camera.bottom = -2000;
        this.scene.add(directionalLight);
    }
    
    createBoundaries() {
        // 创建场景边界（透明盒子）
        const geometry = new THREE.BoxGeometry(
            this.sceneParams.width,
            this.sceneParams.height,
            this.sceneParams.depth
        );
        
        const material = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        
        const boundaryBox = new THREE.Mesh(geometry, material);
        boundaryBox.position.set(0, this.sceneParams.height / 2, 0);
        this.scene.add(boundaryBox);
        
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(
            this.sceneParams.width,
            this.sceneParams.depth
        );
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    setupControls() {
        // 简化的相机控制（鼠标交互）
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            prevX: 0,
            prevY: 0
        };
        
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.container.addEventListener('wheel', (e) => this.onMouseWheel(e));
    }
    
    onMouseDown(event) {
        this.mouse.isDown = true;
        this.mouse.prevX = event.clientX;
        this.mouse.prevY = event.clientY;
    }
    
    onMouseMove(event) {
        if (!this.mouse.isDown) return;
        
        const deltaX = event.clientX - this.mouse.prevX;
        const deltaY = event.clientY - this.mouse.prevY;
        
        // 旋转相机
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 500, 0);
        
        this.mouse.prevX = event.clientX;
        this.mouse.prevY = event.clientY;
    }
    
    onMouseUp() {
        this.mouse.isDown = false;
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        const scale = event.deltaY > 0 ? 1.1 : 0.9;
        this.camera.position.multiplyScalar(scale);
        
        // 限制缩放范围
        const distance = this.camera.position.length();
        if (distance < 500) {
            this.camera.position.normalize().multiplyScalar(500);
        } else if (distance > 5000) {
            this.camera.position.normalize().multiplyScalar(5000);
        }
    }
    
    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
    
    onWindowResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    // 视角切换功能
    setView(viewType) {
        const positions = {
            front: { x: 0, y: 1000, z: 3000 },
            side: { x: 3000, y: 1000, z: 0 },
            top: { x: 0, y: 3500, z: 0 },
            free: { x: 2500, y: 1500, z: 2500 }
        };
        
        const pos = positions[viewType];
        if (pos) {
            // 平滑过渡动画
            const startPos = this.camera.position.clone();
            const endPos = new THREE.Vector3(pos.x, pos.y, pos.z);
            
            this.animateCamera(startPos, endPos, 1000);
        }
    }
    
    animateCamera(startPos, endPos, duration) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = this.easeInOutCubic(progress);
            
            this.camera.position.lerpVectors(startPos, endPos, easeProgress);
            this.camera.lookAt(0, 500, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    // 清理资源
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
    }
    
    // 获取场景对象供其他系统使用
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
}

// 导出供其他模块使用
window.AtmosphereSimulation = AtmosphereSimulation;