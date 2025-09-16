/**
 * 热力系统 - 核心物理模拟
 * 负责温度场计算、气压场生成和热力驱动
 */

class ThermalSystem {
    constructor(scene, params = {}) {
        this.scene = scene;
        this.params = {
            gridSize: params.gridSize || 50,
            heightLevels: params.heightLevels || 20,
            heatSourcePos: params.heatSourcePos || { x: -800, z: 0 },
            coldSourcePos: params.coldSourcePos || { x: 800, z: 0 },
            baseTemperature: params.baseTemperature || 20,
            ...params
        };
        
        // 温度场和气压场数据
        this.temperatureField = [];
        this.pressureField = [];
        this.densityField = [];
        
        // 热源和冷源
        this.heatSource = null;
        this.coldSource = null;
        this.heatIntensity = 80;
        this.coldIntensity = 60;
        
        // 可视化对象
        this.temperatureMesh = null;
        this.pressureMeshes = [];
        this.windArrows = [];
        
        this.init();
    }
    
    init() {
        this.initializeFields();
        this.createHeatSources();
        this.createTemperatureVisualization();
        this.createPressureVisualization();
    }
    
    initializeFields() {
        const { gridSize, heightLevels } = this.params;
        
        // 初始化三维网格
        for (let h = 0; h < heightLevels; h++) {
            this.temperatureField[h] = [];
            this.pressureField[h] = [];
            this.densityField[h] = [];
            
            for (let x = 0; x < gridSize; x++) {
                this.temperatureField[h][x] = [];
                this.pressureField[h][x] = [];
                this.densityField[h][x] = [];
                
                for (let z = 0; z < gridSize; z++) {
                    // 基础温度随高度递减（标准大气）
                    const height = (h / heightLevels) * 2000;
                    const baseTemp = this.params.baseTemperature - height * 0.0065;
                    
                    this.temperatureField[h][x][z] = baseTemp;
                    this.pressureField[h][x][z] = this.calculateBasePressure(height);
                    this.densityField[h][x][z] = this.calculateDensity(
                        this.pressureField[h][x][z], 
                        this.temperatureField[h][x][z]
                    );
                }
            }
        }
    }
    
    calculateBasePressure(height) {
        // 标准大气压公式
        return 101325 * Math.pow(1 - 0.0065 * height / 288.15, 5.255);
    }
    
    calculateDensity(pressure, temperature) {
        // 理想气体状态方程
        const R = 287.05; // 干空气气体常数
        return pressure / (R * (temperature + 273.15));
    }
    
    createHeatSources() {
        // 创建热源（红色圆柱体）
        const heatGeometry = new THREE.CylinderGeometry(200, 200, 50, 32);
        const heatMaterial = new THREE.MeshLambertMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.7
        });
        
        this.heatSource = new THREE.Mesh(heatGeometry, heatMaterial);
        this.heatSource.position.set(this.params.heatSourcePos.x, 25, this.params.heatSourcePos.z);
        this.scene.add(this.heatSource);
        
        // 创建冷源（蓝色圆柱体）
        const coldGeometry = new THREE.CylinderGeometry(200, 200, 50, 32);
        const coldMaterial = new THREE.MeshLambertMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.7
        });
        
        this.coldSource = new THREE.Mesh(coldGeometry, coldMaterial);
        this.coldSource.position.set(this.params.coldSourcePos.x, 25, this.params.coldSourcePos.z);
        this.scene.add(this.coldSource);
        
        // 添加光源效果
        const heatLight = new THREE.PointLight(0xff6666, 1, 1000);
        heatLight.position.set(this.params.heatSourcePos.x, 100, this.params.heatSourcePos.z);
        this.scene.add(heatLight);
        
        const coldLight = new THREE.PointLight(0x6666ff, 1, 1000);
        coldLight.position.set(this.params.coldSourcePos.x, 100, this.params.coldSourcePos.z);
        this.scene.add(coldLight);
    }
    
    createTemperatureVisualization() {
        // 创建温度场可视化（体素化表示）
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        const { gridSize, heightLevels } = this.params;
        const spacing = 4000 / gridSize;
        
        for (let h = 0; h < heightLevels; h += 2) {
            for (let x = 0; x < gridSize; x += 2) {
                for (let z = 0; z < gridSize; z += 2) {
                    const temp = this.temperatureField[h][x][z];
                    const color = this.temperatureToColor(temp);
                    
                    positions.push(
                        (x - gridSize/2) * spacing,
                        h * 100,
                        (z - gridSize/2) * spacing
                    );
                    
                    colors.push(color.r, color.g, color.b);
                }
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 30,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        this.temperatureMesh = new THREE.Points(geometry, material);
        this.scene.add(this.temperatureMesh);
    }
    
    createPressureVisualization() {
        // 创建等压面可视化
        this.pressureMeshes = [];
        
        const pressureLevels = [101000, 100000, 99000, 98000, 97000];
        
        pressureLevels.forEach((pressure, index) => {
            const geometry = new THREE.PlaneGeometry(4000, 1000, 50, 20);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(index * 0.1, 0.7, 0.5),
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                wireframe: true
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = 500 + index * 200;
            mesh.rotation.x = -Math.PI / 2;
            this.scene.add(mesh);
            this.pressureMeshes.push(mesh);
        });
    }
    
    temperatureToColor(temperature) {
        // 温度到颜色的映射
        const minTemp = -10;
        const maxTemp = 40;
        const normalized = (temperature - minTemp) / (maxTemp - minTemp);
        
        const hue = (1 - normalized) * 0.7; // 红色到蓝色
        const color = new THREE.Color();
        color.setHSL(hue, 0.8, 0.5);
        return color;
    }
    
    updateFields(deltaTime) {
        // 更新温度场
        this.updateTemperatureField();
        
        // 更新气压场
        this.updatePressureField();
        
        // 更新可视化
        this.updateVisualization();
    }
    
    updateTemperatureField() {
        const { gridSize, heightLevels } = this.params;
        
        // 热源和冷源的影响
        for (let h = 0; h < heightLevels; h++) {
            for (let x = 0; x < gridSize; x++) {
                for (let z = 0; z < gridSize; z++) {
                    const worldX = (x - gridSize/2) * (4000/gridSize);
                    const worldZ = (z - gridSize/2) * (1000/gridSize);
                    
                    // 计算到热源的距离
                    const heatDist = Math.sqrt(
                        Math.pow(worldX - this.params.heatSourcePos.x, 2) +
                        Math.pow(worldZ - this.params.heatSourcePos.z, 2)
                    );
                    
                    // 计算到冷源的距离
                    const coldDist = Math.sqrt(
                        Math.pow(worldX - this.params.coldSourcePos.x, 2) +
                        Math.pow(worldZ - this.params.coldSourcePos.z, 2)
                    );
                    
                    // 热源影响
                    if (heatDist < 800) {
                        const heatInfluence = (1 - heatDist / 800) * this.heatIntensity / 100;
                        this.temperatureField[h][x][z] += heatInfluence * 0.1;
                    }
                    
                    // 冷源影响
                    if (coldDist < 800) {
                        const coldInfluence = (1 - coldDist / 800) * this.coldIntensity / 100;
                        this.temperatureField[h][x][z] -= coldInfluence * 0.1;
                    }
                    
                    // 温度随高度递减
                    const height = (h / heightLevels) * 2000;
                    const lapseRate = 0.0065; // 温度垂直递减率
                    this.temperatureField[h][x][z] = 
                        this.temperatureField[h][x][z] - height * lapseRate * 0.01;
                }
            }
        }
    }
    
    updatePressureField() {
        const { gridSize, heightLevels } = this.params;
        
        for (let h = 0; h < heightLevels; h++) {
            for (let x = 0; x < gridSize; x++) {
                for (let z = 0; z < gridSize; z++) {
                    const temp = this.temperatureField[h][x][z];
                    const height = (h / heightLevels) * 2000;
                    
                    // 根据温度计算气压变化
                    const basePressure = this.calculateBasePressure(height);
                    const tempRatio = (temp + 273.15) / 288.15;
                    const pressureVariation = basePressure * (1 - (tempRatio - 1) * 0.1);
                    
                    this.pressureField[h][x][z] = pressureVariation;
                    this.densityField[h][x][z] = this.calculateDensity(
                        pressureVariation, temp
                    );
                }
            }
        }
    }
    
    updateVisualization() {
        if (!this.temperatureMesh) return;
        
        // 更新温度可视化
        const colors = [];
        const { gridSize, heightLevels } = this.params;
        
        for (let h = 0; h < heightLevels; h += 2) {
            for (let x = 0; x < gridSize; x += 2) {
                for (let z = 0; z < gridSize; z += 2) {
                    const temp = this.temperatureField[h][x][z];
                    const color = this.temperatureToColor(temp);
                    colors.push(color.r, color.g, color.b);
                }
            }
        }
        
        this.temperatureMesh.geometry.setAttribute(
            'color', 
            new THREE.Float32BufferAttribute(colors, 3)
        );
    }
    
    setHeatIntensity(intensity) {
        this.heatIntensity = Math.max(0, Math.min(100, intensity));
    }
    
    setColdIntensity(intensity) {
        this.coldIntensity = Math.max(0, Math.min(100, intensity));
    }
    
    getTemperatureAt(x, y, z) {
        // 获取指定位置的温度
        const gridSize = this.params.gridSize;
        const spacing = 4000 / gridSize;
        
        const gridX = Math.floor((x + 2000) / spacing);
        const gridZ = Math.floor((z + 500) / spacing);
        const gridH = Math.floor(y / 100);
        
        if (gridX >= 0 && gridX < gridSize && 
            gridZ >= 0 && gridZ < gridSize && 
            gridH >= 0 && gridH < this.params.heightLevels) {
            return this.temperatureField[gridH][gridX][gridZ];
        }
        
        return this.params.baseTemperature;
    }
    
    getPressureAt(x, y, z) {
        // 获取指定位置的气压
        const gridSize = this.params.gridSize;
        const spacing = 4000 / gridSize;
        
        const gridX = Math.floor((x + 2000) / spacing);
        const gridZ = Math.floor((z + 500) / spacing);
        const gridH = Math.floor(y / 100);
        
        if (gridX >= 0 && gridX < gridSize && 
            gridZ >= 0 && gridZ < gridSize && 
            gridH >= 0 && gridH < this.params.heightLevels) {
            return this.pressureField[gridH][gridX][gridZ];
        }
        
        return 101325; // 标准大气压
    }
    
    getWindVectorAt(x, y, z) {
        // 计算该位置的风向量（基于气压梯度）
        const delta = 50;
        
        const p0 = this.getPressureAt(x, y, z);
        const px = this.getPressureAt(x + delta, y, z);
        const pz = this.getPressureAt(x, y, z + delta);
        
        // 气压梯度力
        const fx = -(px - p0) / delta;
        const fz = -(pz - p0) / delta;
        
        // 简化：垂直方向基于温度差异
        const temp = this.getTemperatureAt(x, y, z);
        const tempBelow = this.getTemperatureAt(x, y - 100, z);
        const fy = (temp - tempBelow) * 0.01;
        
        return new THREE.Vector3(fx, fy, fz);
    }
    
    toggleVisualization(type, visible) {
        switch(type) {
            case 'temperature':
                if (this.temperatureMesh) {
                    this.temperatureMesh.visible = visible;
                }
                break;
            case 'pressure':
                this.pressureMeshes.forEach(mesh => {
                    mesh.visible = visible;
                });
                break;
        }
    }
    
    dispose() {
        if (this.temperatureMesh) {
            this.scene.remove(this.temperatureMesh);
            this.temperatureMesh.geometry.dispose();
            this.temperatureMesh.material.dispose();
        }
        
        this.pressureMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        
        if (this.heatSource) {
            this.scene.remove(this.heatSource);
            this.heatSource.geometry.dispose();
            this.heatSource.material.dispose();
        }
        
        if (this.coldSource) {
            this.scene.remove(this.coldSource);
            this.coldSource.geometry.dispose();
            this.coldSource.material.dispose();
        }
    }
}

// 导出供其他模块使用
window.ThermalSystem = ThermalSystem;