/**
 * 可视化系统
 * 负责管理和协调所有可视化组件
 */

class Visualization {
    constructor(scene, thermalSystem, particleSystem) {
        this.scene = scene;
        this.thermalSystem = thermalSystem;
        this.particleSystem = particleSystem;
        
        // 可视化状态
        this.visibleLayers = {
            temperature: true,
            pressure: true,
            wind: true,
            particles: true,
            axes: true  // 新增坐标轴显示控制
        };
        
        // 可视化对象
        this.gridLines = null;
        this.axisHelper = null;
        this.infoPanel = null;
        
        this.init();
    }
    
    init() {
        this.createGridLines();
        this.createAxisHelper();
        this.setupInfoPanel();
    }
    
    createGridLines() {
        const gridHelper = new THREE.GridHelper(4000, 20, 0x444444, 0x888888);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);
        
        // 创建垂直网格
        const verticalGrid = new THREE.Group();
        
        for (let i = -2000; i <= 2000; i += 400) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(i, 0, -500),
                new THREE.Vector3(i, 2000, -500),
                new THREE.Vector3(i, 2000, 500),
                new THREE.Vector3(i, 0, 500),
                new THREE.Vector3(i, 0, -500)
            ]);
            
            const material = new THREE.LineBasicMaterial({ 
                color: 0x444444, 
                transparent: true, 
                opacity: 0.3 
            });
            const line = new THREE.Line(geometry, material);
            verticalGrid.add(line);
        }
        
        for (let i = -500; i <= 500; i += 250) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2000, 0, i),
                new THREE.Vector3(-2000, 2000, i),
                new THREE.Vector3(2000, 2000, i),
                new THREE.Vector3(2000, 0, i),
                new THREE.Vector3(-2000, 0, i)
            ]);
            
            const material = new THREE.LineBasicMaterial({ 
                color: 0x444444, 
                transparent: true, 
                opacity: 0.3 
            });
            const line = new THREE.Line(geometry, material);
            verticalGrid.add(line);
        }
        
        this.scene.add(verticalGrid);
        this.gridLines = { horizontal: gridHelper, vertical: verticalGrid };
    }
    
    createAxisHelper() {
        // 创建增强坐标轴
        const axisGroup = new THREE.Group();
        
        // X轴（红色）- 增强为粗线条并添加刻度
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(2500, 0, 0)
        ]);
        const xMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            linewidth: 3 
        });
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        axisGroup.add(xAxis);
        
        // Y轴（绿色）- 增强为粗线条
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 2500, 0)
        ]);
        const yMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 3 
        });
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        axisGroup.add(yAxis);
        
        // Z轴（蓝色）- 增强为粗线条
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 750)
        ]);
        const zMaterial = new THREE.LineBasicMaterial({ 
            color: 0x0000ff, 
            linewidth: 3 
        });
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        axisGroup.add(zAxis);
        
        // 添加刻度和数据标注
        this.createAxisScales(axisGroup);
        
        // 添加轴标签
        this.createAxisLabels(axisGroup);
        
        // 添加原点标记
        this.createOriginMarker(axisGroup);
        
        this.scene.add(axisGroup);
        this.axisHelper = axisGroup;
    }
    
    createAxisLabels(axisGroup) {
        // 创建文本精灵作为标签
        const createLabel = (text, position, color) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 32;
            
            context.fillStyle = color;
            context.font = 'bold 20px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 32, 16);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(position);
            sprite.scale.set(100, 50, 1);
            
            return sprite;
        };
        
        axisGroup.add(createLabel('X', new THREE.Vector3(2600, 0, 0), '#ff0000'));
        axisGroup.add(createLabel('Y', new THREE.Vector3(0, 2600, 0), '#00ff00'));
        axisGroup.add(createLabel('Z', new THREE.Vector3(0, 0, 850), '#0000ff'));
    }
    
    createAxisScales(axisGroup) {
        // 创建X轴刻度 (每500m一个)
        for (let i = 500; i <= 2000; i += 500) {
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(i, -50, 0),
                new THREE.Vector3(i, 50, 0)
            ]);
            const tickMaterial = new THREE.LineBasicMaterial({ color: 0xff6666 });
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            axisGroup.add(tick);
            
            // 添加数值标签
            const label = this.createScaleLabel(`${i}m`, new THREE.Vector3(i, -120, 0), '#ff6666');
            axisGroup.add(label);
        }
        
        // 创建Y轴刻度 (每500m一个)
        for (let i = 500; i <= 2000; i += 500) {
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-50, i, 0),
                new THREE.Vector3(50, i, 0)
            ]);
            const tickMaterial = new THREE.LineBasicMaterial({ color: 0x66ff66 });
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            axisGroup.add(tick);
            
            // 添加数值标签
            const label = this.createScaleLabel(`${i}m`, new THREE.Vector3(-120, i, 0), '#66ff66');
            axisGroup.add(label);
        }
        
        // 创建Z轴刻度 (每250m一个)
        for (let i = 250; i <= 500; i += 250) {
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, -50, i),
                new THREE.Vector3(0, 50, i)
            ]);
            const tickMaterial = new THREE.LineBasicMaterial({ color: 0x6666ff });
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            axisGroup.add(tick);
            
            // 添加数值标签
            const label = this.createScaleLabel(`${i}m`, new THREE.Vector3(0, -120, i), '#6666ff');
            axisGroup.add(label);
        }
    }
    
    createScaleLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 80;
        canvas.height = 24;
        
        context.fillStyle = color;
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 40, 12);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(80, 24, 1);
        
        return sprite;
    }
    
    createOriginMarker(axisGroup) {
        // 在原点创建一个小球
        const originGeometry = new THREE.SphereGeometry(30, 16, 16);
        const originMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const originMarker = new THREE.Mesh(originGeometry, originMaterial);
        originMarker.position.set(0, 0, 0);
        axisGroup.add(originMarker);
        
        // 添加"原点"标签
        const label = this.createScaleLabel('原点', new THREE.Vector3(0, -80, 0), '#ffffff');
        axisGroup.add(label);
    }
    
    setupInfoPanel() {
        // 创建信息面板（使用HTML覆盖层）
        this.createLegend();
    }
    
    createLegend() {
        // 创建温度图例
        const legendDiv = document.createElement('div');
        legendDiv.className = 'temperature-legend';
        legendDiv.innerHTML = `
            <h4>温度图例</h4>
            <div class="legend-scale">
                <div class="legend-item">
                    <div class="legend-color" style="background: #ff0000"></div>
                    <span>40°C</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ff8800"></div>
                    <span>20°C</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #0088ff"></div>
                    <span>0°C</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #0000ff"></div>
                    <span>-10°C</span>
                </div>
            </div>
        `;
        
        legendDiv.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            z-index: 100;
        `;
        
        document.querySelector('.scene-container').appendChild(legendDiv);
        this.legend = legendDiv;
    }
    
    toggleLayer(layerType, visible) {
        this.visibleLayers[layerType] = visible;
        
        switch(layerType) {
            case 'temperature':
                this.thermalSystem.toggleVisualization('temperature', visible);
                break;
            case 'pressure':
                this.thermalSystem.toggleVisualization('pressure', visible);
                break;
            case 'wind':
                if (visible && !this.particleSystem.windArrows) {
                    this.particleSystem.createWindArrows();
                }
                this.particleSystem.toggleWindArrows(visible);
                break;
            case 'particles':
                this.particleSystem.toggleVisibility(visible);
                break;
            case 'axes':
                if (this.axisHelper) {
                    this.axisHelper.visible = visible;
                }
                break;
        }
    }
    
    updateInfoPanel() {
        // 更新实时数据显示
        const hotTemp = this.thermalSystem.getTemperatureAt(-800, 100, 0);
        const coldTemp = this.thermalSystem.getTemperatureAt(800, 100, 0);
        
        document.getElementById('hotTemp').textContent = `${hotTemp.toFixed(1)}°C`;
        document.getElementById('coldTemp').textContent = `${coldTemp.toFixed(1)}°C`;
        
        // 计算最大风速
        let maxWindSpeed = 0;
        for (let x = -1500; x <= 1500; x += 500) {
            for (let z = -300; z <= 300; z += 150) {
                const wind = this.thermalSystem.getWindVectorAt(x, 1000, z);
                maxWindSpeed = Math.max(maxWindSpeed, wind.length());
            }
        }
        
        document.getElementById('maxWindSpeed').textContent = `${(maxWindSpeed * 10).toFixed(1)} m/s`;
    }
    
    createStreamlines() {
        // 创建流线可视化
        const streamlineGroup = new THREE.Group();
        
        const startPoints = [
            { x: -1800, y: 100, z: 0 },
            { x: -1800, y: 300, z: 0 },
            { x: -1800, y: 500, z: 0 },
            { x: -1800, y: 800, z: 0 },
            { x: -1800, y: 1200, z: 0 }
        ];
        
        startPoints.forEach(start => {
            const streamline = this.createSingleStreamline(start);
            streamlineGroup.add(streamline);
        });
        
        this.scene.add(streamlineGroup);
        this.streamlineGroup = streamlineGroup;
    }
    
    createSingleStreamline(start) {
        const points = [];
        const maxSteps = 100;
        const stepSize = 50;
        
        let currentPos = new THREE.Vector3(start.x, start.y, start.z);
        
        for (let i = 0; i < maxSteps; i++) {
            points.push(currentPos.clone());
            
            const windVector = this.thermalSystem.getWindVectorAt(
                currentPos.x, currentPos.y, currentPos.z
            );
            
            if (windVector.length() < 0.1) break;
            
            currentPos.add(windVector.normalize().multiplyScalar(stepSize));
            
            // 检查边界
            if (Math.abs(currentPos.x) > 2000 || 
                currentPos.y < 0 || currentPos.y > 2000 ||
                Math.abs(currentPos.z) > 500) {
                break;
            }
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });
        
        return new THREE.Line(geometry, material);
    }
    
    toggleStreamlines(visible) {
        if (!this.streamlineGroup) {
            this.createStreamlines();
        }
        
        if (this.streamlineGroup) {
            this.streamlineGroup.visible = visible;
        }
    }
    
    // 创建剖面视图
    createCrossSection(axis, position) {
        const sectionGroup = new THREE.Group();
        
        if (axis === 'x') {
            const geometry = new THREE.PlaneGeometry(1000, 2000, 20, 40);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = position;
            mesh.rotation.y = Math.PI / 2;
            sectionGroup.add(mesh);
            
            // 添加温度纹理
            this.createTemperatureTexture(mesh, 'x', position);
        }
        
        this.scene.add(sectionGroup);
        return sectionGroup;
    }
    
    createTemperatureTexture(mesh, axis, position) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // 创建温度梯度纹理
        const imageData = ctx.createImageData(256, 512);
        
        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 256; x++) {
                const height = (y / 512) * 2000;
                let temp = 20 - height * 0.0065;
                
                if (axis === 'x') {
                    temp = this.thermalSystem.getTemperatureAt(position, height, 0);
                }
                
                const color = this.temperatureToColor(temp);
                const index = (y * 256 + x) * 4;
                
                imageData.data[index] = color.r * 255;
                imageData.data[index + 1] = color.g * 255;
                imageData.data[index + 2] = color.b * 255;
                imageData.data[index + 3] = 128;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
    }
    
    temperatureToColor(temp) {
        const minTemp = -10;
        const maxTemp = 40;
        const normalized = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
        
        const hue = (1 - normalized) * 0.7;
        const color = new THREE.Color();
        color.setHSL(hue, 0.8, 0.5);
        return color;
    }
    
    dispose() {
        if (this.legend) {
            this.legend.remove();
        }
        
        if (this.gridLines) {
            this.scene.remove(this.gridLines.horizontal);
            this.scene.remove(this.gridLines.vertical);
        }
        
        if (this.axisHelper) {
            this.scene.remove(this.axisHelper);
        }
        
        if (this.streamlineGroup) {
            this.scene.remove(this.streamlineGroup);
        }
    }
}

// 导出供其他模块使用
window.Visualization = Visualization;