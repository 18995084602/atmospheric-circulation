/**
 * 三维大气热力环流模拟系统 - 主应用
 * 协调各个子系统的运行
 */

class ThermalCirculationApp {
    constructor() {
        this.atmosphere = null;
        this.thermalSystem = null;
        this.particleSystem = null;
        this.visualization = null;
        this.educationSystem = null;
        
        this.isPlaying = false;
        this.simulationSpeed = 1.0;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupUI();
        this.startRenderLoop();
    }
    
    setupScene() {
        // 初始化大气模拟场景
        this.atmosphere = new AtmosphereSimulation('threeScene');
        const scene = this.atmosphere.getScene();
        
        // 初始化热力系统
        this.thermalSystem = new ThermalSystem(scene, {
            gridSize: 50,
            heightLevels: 20,
            heatSourcePos: { x: -800, z: 0 },
            coldSourcePos: { x: 800, z: 0 },
            baseTemperature: 20
        });
        
        // 初始化粒子系统
        this.particleSystem = new ParticleSystem(
            scene, 
            this.thermalSystem, 
            { maxParticles: 1000, particleSize: 5, particleSpeed: 1 }
        );
        
        // 初始化可视化系统
        this.visualization = new Visualization(
            scene, 
            this.thermalSystem, 
            this.particleSystem
        );
        
        // 初始化教育系统
        this.educationSystem = new EducationSystem(
            this.thermalSystem, 
            this.particleSystem
        );
    }
    
    setupUI() {
        // 模拟控制
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // 速度控制
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            this.setSpeed(parseFloat(e.target.value));
        });
        
        // 热源强度控制
        const heatSlider = document.getElementById('heatIntensity');
        heatSlider.addEventListener('input', (e) => {
            this.setHeatIntensity(parseInt(e.target.value));
            document.getElementById('heatValue').textContent = e.target.value + '%';
        });
        
        // 冷源强度控制
        const coldSlider = document.getElementById('coldIntensity');
        coldSlider.addEventListener('input', (e) => {
            this.setColdIntensity(parseInt(e.target.value));
            document.getElementById('coldValue').textContent = e.target.value + '%';
        });
        
        // 视角控制
        document.getElementById('frontView').addEventListener('click', () => {
            this.setView('front');
            this.updateViewButtons('front');
        });
        
        document.getElementById('sideView').addEventListener('click', () => {
            this.setView('side');
            this.updateViewButtons('side');
        });
        
        document.getElementById('topView').addEventListener('click', () => {
            this.setView('top');
            this.updateViewButtons('top');
        });
        
        document.getElementById('freeView').addEventListener('click', () => {
            this.setView('free');
            this.updateViewButtons('free');
        });
        
        // 可视化图层控制
        document.getElementById('showAxes').addEventListener('change', (e) => {
            this.visualization.toggleLayer('axes', e.target.checked);
        });
        
        document.getElementById('showTemperature').addEventListener('change', (e) => {
            this.visualization.toggleLayer('temperature', e.target.checked);
        });
        
        document.getElementById('showPressure').addEventListener('change', (e) => {
            this.visualization.toggleLayer('pressure', e.target.checked);
        });
        
        document.getElementById('showWind').addEventListener('change', (e) => {
            this.visualization.toggleLayer('wind', e.target.checked);
        });
        
        document.getElementById('showParticles').addEventListener('change', (e) => {
            this.visualization.toggleLayer('particles', e.target.checked);
        });
        
        // 初始化显示值
        document.getElementById('heatValue').textContent = heatSlider.value + '%';
        document.getElementById('coldValue').textContent = coldSlider.value + '%';
        document.getElementById('speedValue').textContent = speedSlider.value + 'x';
    }
    
    startRenderLoop() {
        const animate = (currentTime) => {
            requestAnimationFrame(animate);
            
            if (this.isPlaying) {
                const deltaTime = (currentTime - this.lastTime) / 1000;
                this.update(deltaTime * this.simulationSpeed);
                this.lastTime = currentTime;
            } else {
                this.lastTime = currentTime;
            }
            
            // 更新实时数据
            this.visualization.updateInfoPanel();
        };
        
        animate(0);
    }
    
    update(deltaTime) {
        // 更新热力系统
        this.thermalSystem.updateFields(deltaTime);
        
        // 更新粒子系统
        this.particleSystem.update(deltaTime);
        this.particleSystem.updateWindArrows();
    }
    
    // 控制方法
    play() {
        this.isPlaying = true;
        this.particleSystem.start();
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
    }
    
    pause() {
        this.isPlaying = false;
        this.particleSystem.pause();
        document.getElementById('playBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'none';
    }
    
    reset() {
        this.pause();
        this.thermalSystem.setHeatIntensity(80);
        this.thermalSystem.setColdIntensity(60);
        this.particleSystem.reset();
        this.visualization.updateInfoPanel();
        
        // 重置教育系统
        if (this.educationSystem.isInStepMode()) {
            this.educationSystem.endStepMode();
        }
    }
    
    setSpeed(speed) {
        this.simulationSpeed = speed;
        this.particleSystem.setSpeed(speed);
        document.getElementById('speedValue').textContent = speed + 'x';
    }
    
    setHeatIntensity(intensity) {
        this.thermalSystem.setHeatIntensity(intensity);
    }
    
    setColdIntensity(intensity) {
        this.thermalSystem.setColdIntensity(intensity);
    }
    
    setView(viewType) {
        this.atmosphere.setView(viewType);
        document.getElementById('currentView').textContent = 
            viewType === 'front' ? '正视图' :
            viewType === 'side' ? '侧视图' :
            viewType === 'top' ? '俯视图' : '自由视角';
    }
    
    updateViewButtons(activeView) {
        const buttons = ['frontView', 'sideView', 'topView', 'freeView'];
        buttons.forEach(btn => {
            document.getElementById(btn).classList.remove('active');
        });
        document.getElementById(activeView).classList.add('active');
    }
    
    // 窗口大小调整
    onWindowResize() {
        this.atmosphere.onWindowResize();
    }
    
    // 清理资源
    dispose() {
        this.pause();
        
        if (this.atmosphere) {
            this.atmosphere.dispose();
        }
        
        if (this.thermalSystem) {
            this.thermalSystem.dispose();
        }
        
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
        
        if (this.visualization) {
            this.visualization.dispose();
        }
        
        if (this.educationSystem) {
            this.educationSystem.dispose();
        }
    }
}

// 全局应用实例
let app;
let educationSystem;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app = new ThermalCirculationApp();
    educationSystem = app.educationSystem;
    
    // 窗口大小调整事件
    window.addEventListener('resize', () => {
        app.onWindowResize();
    });
    
    // 防止页面刷新时丢失状态
    window.addEventListener('beforeunload', () => {
        app.dispose();
    });
});

// 全局函数供HTML调用
function submitAnswer() {
    if (educationSystem) {
        educationSystem.submitAnswer();
    }
}

function nextQuestion() {
    if (educationSystem) {
        educationSystem.nextQuestion();
    }
}

function restartQuiz() {
    if (educationSystem) {
        educationSystem.restartQuiz();
    }
}

function closeQuiz() {
    if (educationSystem) {
        educationSystem.closeQuiz();
    }
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (app.isPlaying) {
                app.pause();
            } else {
                app.play();
            }
            break;
        case 'r':
            app.reset();
            break;
        case '1':
            app.setView('front');
            app.updateViewButtons('frontView');
            break;
        case '2':
            app.setView('side');
            app.updateViewButtons('sideView');
            break;
        case '3':
            app.setView('top');
            app.updateViewButtons('topView');
            break;
        case '4':
            app.setView('free');
            app.updateViewButtons('freeView');
            break;
    }
});

// 添加样式支持
document.addEventListener('DOMContentLoaded', () => {
    // 添加测验样式
    const style = document.createElement('style');
    style.textContent = `
        .quiz-question, .quiz-feedback, .quiz-result {
            padding: 20px;
        }
        
        .quiz-options {
            margin: 20px 0;
        }
        
        .quiz-option {
            display: block;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .quiz-option:hover {
            background: #e9ecef;
        }
        
        .quiz-option input {
            margin-right: 10px;
        }
        
        .feedback-result {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .feedback-result.correct {
            color: #28a745;
        }
        
        .feedback-result.incorrect {
            color: #dc3545;
        }
        
        .result-score {
            text-align: center;
            margin: 20px 0;
        }
        
        .score-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: #007bff;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin: 0 auto 15px;
        }
        
        .result-level {
            font-size: 16px;
            color: #666;
            margin-top: 10px;
        }
        
        .result-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);
});