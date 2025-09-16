/**
 * 教育系统
 * 负责分步演示、知识测验和教学辅助功能
 */

class EducationSystem {
    constructor(thermalSystem, particleSystem) {
        this.thermalSystem = thermalSystem;
        this.particleSystem = particleSystem;
        
        // 分步演示数据
        this.steps = [
            {
                title: "步骤1：初始状态",
                description: "地表温度均匀，空气静止，气压分布均匀。此时没有热力环流。",
                actions: () => {
                    this.resetToInitialState();
                },
                duration: 3000
            },
            {
                title: "步骤2：冷热不均形成",
                description: "左侧地表加热，右侧地表冷却。热空气膨胀上升，冷空气收缩下沉。",
                actions: () => {
                    this.showTemperatureDifference();
                },
                duration: 4000
            },
            {
                title: "步骤3：垂直运动开始",
                description: "热空气受热上升，在高空堆积；冷空气下沉，在近地面聚集。",
                actions: () => {
                    this.showVerticalMovement();
                },
                duration: 5000
            },
            {
                title: "步骤4：气压差异形成",
                description: "高空形成高压（热区上方）和低压（冷区上方）；地面形成低压（热区）和高压（冷区）。",
                actions: () => {
                    this.showPressureDistribution();
                },
                duration: 5000
            },
            {
                title: "步骤5：水平运动开始",
                description: "空气从高压区流向低压区，形成水平气流。高空从热区流向冷区，地面从冷区流向热区。",
                actions: () => {
                    this.showHorizontalMovement();
                },
                duration: 6000
            }
        ];
        
        this.currentStep = 0;
        this.isStepMode = false;
        this.stepTimer = null;
        
        // 测验数据
        this.quizQuestions = [
            {
                question: "大气热力环流的根本驱动力是什么？",
                options: [
                    "地球自转",
                    "地表冷热不均",
                    "地形起伏",
                    "湿度差异"
                ],
                correct: 1,
                explanation: "地表冷热不均是热力环流的根本驱动力，它导致空气密度差异，进而产生气压梯度力。"
            },
            {
                question: "在热力环流中，热空气的运动方向是？",
                options: [
                    "下沉",
                    "上升",
                    "水平流动",
                    "静止不动"
                ],
                correct: 1,
                explanation: "热空气密度小，受到浮力作用会上升，这是热力环流垂直运动的重要组成部分。"
            },
            {
                question: "热力环流形成过程中，气压最高的区域通常出现在？",
                options: [
                    "热区地面",
                    "冷区地面",
                    "热区高空",
                    "冷区高空"
                ],
                correct: 2,
                explanation: "热区高空由于热空气上升堆积，形成相对高压，这是驱动水平气流的重要动力。"
            },
            {
                question: "以下哪个现象可以用热力环流原理解释？",
                options: [
                    "台风形成",
                    "海陆风",
                    "洋流运动",
                    "地震活动"
                ],
                correct: 1,
                explanation: "海陆风是典型的热力环流现象，白天陆地升温快形成海风，夜晚陆地降温快形成陆风。"
            }
        ];
        
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 分步演示按钮
        document.getElementById('stepMode').addEventListener('click', () => {
            this.startStepMode();
        });
        
        document.getElementById('nextStep').addEventListener('click', () => {
            this.nextStep();
        });
        
        // 测验按钮
        document.getElementById('quizMode').addEventListener('click', () => {
            this.startQuiz();
        });
        
        // 关闭模态框
        document.querySelector('.close').addEventListener('click', () => {
            this.closeQuiz();
        });
    }
    
    // 分步演示功能
    startStepMode() {
        this.isStepMode = true;
        this.currentStep = 0;
        
        document.getElementById('stepGuide').style.display = 'block';
        document.getElementById('stepMode').textContent = '退出演示';
        
        // 重置到初始状态
        this.resetToInitialState();
        this.showCurrentStep();
    }
    
    showCurrentStep() {
        if (this.currentStep >= this.steps.length) {
            this.endStepMode();
            return;
        }
        
        const step = this.steps[this.currentStep];
        
        // 更新UI
        document.getElementById('currentStep').textContent = this.currentStep + 1;
        document.getElementById('stepDescription').textContent = step.description;
        
        // 执行步骤动作
        step.actions();
        
        // 设置定时器
        if (this.stepTimer) {
            clearTimeout(this.stepTimer);
        }
        
        this.stepTimer = setTimeout(() => {
            if (this.isStepMode) {
                this.nextStep();
            }
        }, step.duration);
    }
    
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
        } else {
            this.endStepMode();
        }
    }
    
    endStepMode() {
        this.isStepMode = false;
        document.getElementById('stepGuide').style.display = 'none';
        document.getElementById('stepMode').textContent = '分步演示';
        
        if (this.stepTimer) {
            clearTimeout(this.stepTimer);
        }
        
        // 恢复正常模拟
        this.restoreNormalSimulation();
    }
    
    resetToInitialState() {
        // 重置热力系统到初始状态
        this.thermalSystem.setHeatIntensity(0);
        this.thermalSystem.setColdIntensity(0);
        this.particleSystem.pause();
        this.particleSystem.reset();
    }
    
    showTemperatureDifference() {
        this.thermalSystem.setHeatIntensity(80);
        this.thermalSystem.setColdIntensity(60);
        
        // 添加温度差异的可视化强调
        this.highlightTemperatureField();
    }
    
    showVerticalMovement() {
        this.particleSystem.start();
        this.particleSystem.setSpeed(0.5);
        
        // 重点显示垂直运动
        this.createVerticalFlowIndicators();
    }
    
    showPressureDistribution() {
        // 显示等压面
        this.highlightPressureAreas();
    }
    
    showHorizontalMovement() {
        this.particleSystem.setSpeed(1.0);
        
        // 显示完整环流
        this.createCirculationArrows();
    }
    
    restoreNormalSimulation() {
        this.thermalSystem.setHeatIntensity(80);
        this.thermalSystem.setColdIntensity(60);
        this.particleSystem.start();
        this.particleSystem.setSpeed(1.0);
    }
    
    // 可视化辅助方法
    highlightTemperatureField() {
        // 创建温度高亮区域
        const heatArea = this.createHighlightArea(-800, 0, 200, 0xff4444);
        const coldArea = this.createHighlightArea(800, 0, 200, 0x4444ff);
        
        this.scene.add(heatArea);
        this.scene.add(coldArea);
        
        setTimeout(() => {
            this.scene.remove(heatArea);
            this.scene.remove(coldArea);
            heatArea.geometry.dispose();
            heatArea.material.dispose();
            coldArea.geometry.dispose();
            coldArea.material.dispose();
        }, 3000);
    }
    
    createHighlightArea(x, z, radius, color) {
        const geometry = new THREE.RingGeometry(radius - 50, radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 1, z);
        
        return ring;
    }
    
    createVerticalFlowIndicators() {
        // 创建垂直流向箭头
        const arrows = [];
        
        // 热源上升箭头
        for (let i = 0; i < 5; i++) {
            const arrow = this.createFlowArrow(-800, 100 + i * 300, 0, 0, 1, 0, 0xff6666);
            arrows.push(arrow);
            this.scene.add(arrow);
        }
        
        // 冷源下沉箭头
        for (let i = 0; i < 5; i++) {
            const arrow = this.createFlowArrow(800, 1800 - i * 300, 0, 0, -1, 0, 0x6666ff);
            arrows.push(arrow);
            this.scene.add(arrow);
        }
        
        setTimeout(() => {
            arrows.forEach(arrow => {
                this.scene.remove(arrow);
                arrow.geometry.dispose();
                arrow.material.dispose();
            });
        }, 4000);
    }
    
    createFlowArrow(x, y, z, dx, dy, dz, color) {
        const geometry = new THREE.ConeGeometry(20, 60, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const arrow = new THREE.Mesh(geometry, material);
        arrow.position.set(x, y, z);
        
        // 设置箭头方向
        const direction = new THREE.Vector3(dx, dy, dz);
        arrow.lookAt(arrow.position.clone().add(direction));
        
        return arrow;
    }
    
    highlightPressureAreas() {
        // 创建气压区域标记
        const pressureMarkers = [];
        
        // 高压区域
        const highPressure = this.createPressureMarker(-800, 1500, 150, 0xff0000, 'H');
        const lowPressure = this.createPressureMarker(800, 1500, 150, 0x0000ff, 'L');
        
        pressureMarkers.push(highPressure, lowPressure);
        this.scene.add(highPressure);
        this.scene.add(lowPressure);
        
        setTimeout(() => {
            pressureMarkers.forEach(marker => {
                this.scene.remove(marker);
                marker.geometry.dispose();
                marker.material.dispose();
            });
        }, 5000);
    }
    
    createPressureMarker(x, y, radius, color, label) {
        const geometry = new THREE.RingGeometry(radius - 20, radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.set(x, y, 0);
        
        // 添加标签
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        context.fillStyle = color === 0xff0000 ? 'red' : 'blue';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, y, 50);
        sprite.scale.set(100, 100, 1);
        
        const group = new THREE.Group();
        group.add(ring);
        group.add(sprite);
        
        return group;
    }
    
    createCirculationArrows() {
        // 创建完整环流箭头
        const circulationArrows = [];
        
        // 创建环流路径
        const path = [
            { x: -800, y: 100, z: 0 },
            { x: -800, y: 1000, z: 0 },
            { x: 800, y: 1000, z: 0 },
            { x: 800, y: 100, z: 0 },
            { x: -800, y: 100, z: 0 }
        ];
        
        for (let i = 0; i < path.length - 1; i++) {
            const start = new THREE.Vector3(path[i].x, path[i].y, path[i].z);
            const end = new THREE.Vector3(path[i + 1].x, path[i + 1].y, path[i + 1].z);
            
            const arrow = this.createPathArrow(start, end);
            circulationArrows.push(arrow);
            this.scene.add(arrow);
        }
        
        setTimeout(() => {
            circulationArrows.forEach(arrow => {
                this.scene.remove(arrow);
                arrow.geometry.dispose();
                arrow.material.dispose();
            });
        }, 6000);
    }
    
    createPathArrow(start, end) {
        const direction = end.clone().sub(start);
        const length = direction.length();
        
        const geometry = new THREE.CylinderGeometry(5, 15, length, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6
        });
        
        const arrow = new THREE.Mesh(geometry, material);
        arrow.position.copy(start.clone().add(end).multiplyScalar(0.5));
        
        // 设置箭头方向
        arrow.lookAt(end);
        arrow.rotateX(Math.PI / 2);
        
        return arrow;
    }
    
    // 测验功能
    startQuiz() {
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        const modal = document.getElementById('quizModal');
        modal.style.display = 'flex';
        
        this.showQuestion();
    }
    
    showQuestion() {
        if (this.currentQuizIndex >= this.quizQuestions.length) {
            this.showQuizResult();
            return;
        }
        
        const question = this.quizQuestions[this.currentQuizIndex];
        const quizContent = document.getElementById('quizContent');
        
        quizContent.innerHTML = `
            <div class="quiz-question">
                <h3>问题 ${this.currentQuizIndex + 1}/${this.quizQuestions.length}</h3>
                <p>${question.question}</p>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <label class="quiz-option">
                            <input type="radio" name="quiz" value="${index}">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
                <button class="btn primary" onclick="educationSystem.submitAnswer()">提交答案</button>
            </div>
        `;
    }
    
    submitAnswer() {
        const selected = document.querySelector('input[name="quiz"]:checked');
        if (!selected) {
            alert('请选择一个答案！');
            return;
        }
        
        const answer = parseInt(selected.value);
        const question = this.quizQuestions[this.currentQuizIndex];
        
        if (answer === question.correct) {
            this.quizScore++;
        }
        
        // 显示答案解释
        this.showAnswerExplanation(question, answer === question.correct);
    }
    
    showAnswerExplanation(question, isCorrect) {
        const quizContent = document.getElementById('quizContent');
        
        quizContent.innerHTML = `
            <div class="quiz-feedback">
                <div class="feedback-result ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}
                </div>
                <div class="feedback-explanation">
                    <h4>解释：</h4>
                    <p>${question.explanation}</p>
                </div>
                <button class="btn primary" onclick="educationSystem.nextQuestion()">
                    ${this.currentQuizIndex < this.quizQuestions.length - 1 ? '下一题' : '查看结果'}
                </button>
            </div>
        `;
    }
    
    nextQuestion() {
        this.currentQuizIndex++;
        this.showQuestion();
    }
    
    showQuizResult() {
        const percentage = (this.quizScore / this.quizQuestions.length) * 100;
        const quizContent = document.getElementById('quizContent');
        
        let level = '';
        if (percentage >= 80) {
            level = '优秀！';
        } else if (percentage >= 60) {
            level = '良好！';
        } else {
            level = '需要继续努力！';
        }
        
        quizContent.innerHTML = `
            <div class="quiz-result">
                <h3>测验完成！</h3>
                <div class="result-score">
                    <div class="score-circle">
                        <span>${percentage.toFixed(0)}%</span>
                    </div>
                    <p>得分：${this.quizScore}/${this.quizQuestions.length}</p>
                    <p class="result-level">${level}</p>
                </div>
                <div class="result-actions">
                    <button class="btn primary" onclick="educationSystem.restartQuiz()">重新测验</button>
                    <button class="btn secondary" onclick="educationSystem.closeQuiz()">关闭</button>
                </div>
            </div>
        `;
    }
    
    restartQuiz() {
        this.startQuiz();
    }
    
    closeQuiz() {
        const modal = document.getElementById('quizModal');
        modal.style.display = 'none';
    }
    
    // 获取当前教学状态
    getCurrentStep() {
        return this.currentStep;
    }
    
    isInStepMode() {
        return this.isStepMode;
    }
    
    dispose() {
        if (this.stepTimer) {
            clearTimeout(this.stepTimer);
        }
    }
}

// 导出供其他模块使用
window.EducationSystem = EducationSystem;