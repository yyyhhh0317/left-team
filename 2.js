// 全局变量
let frontStream = null;
let backStream = null;
let socket = null;
let photoCount = 0;

// DOM元素
const frontVideo = document.getElementById('frontVideo');
const backVideo = document.getElementById('backVideo');
const frontCanvas = document.getElementById('frontCanvas');
const backCanvas = document.getElementById('backCanvas');
const frontCaptureBtn = document.getElementById('frontCaptureBtn');
const backCaptureBtn = document.getElementById('backCaptureBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const captureBtn = document.getElementById('captureBtn');
const statusText = document.getElementById('statusText');
const countText = document.getElementById('countText');
const guideText = document.getElementById('guideText');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 连接WebSocket服务器
    socket = io('https://1112303hi76bm.vicp.fun:443');
    
    // 处理服务器消息
    socket.on('connect', () => {
        console.log('已连接到服务器', socket.id);
        statusText.textContent = '状态: 已连接服务器';
    });
    
    socket.on('disconnect', () => {
        console.log('与服务器断开连接');
        statusText.textContent = '状态: 服务器连接断开';
    });
    
    socket.on('status', (message) => {
        statusText.textContent = `状态: ${message}`;
    });
    
    socket.on('result', (data) => {
        guideText.innerHTML = `<strong>${data.landscape}讲解:</strong><br>${data.guide}`;
    });
    
    // 按钮事件
    startBtn.addEventListener('click', startCameras);
    stopBtn.addEventListener('click', stopCameras);
    captureBtn.addEventListener('click', captureAndAnalyze);
    frontCaptureBtn.addEventListener('click', () => capturePhoto('front'));
    backCaptureBtn.addEventListener('click', () => capturePhoto('back'));
});

// 启动摄像头
async function startCameras() {
    try {
        // 获取前置摄像头
        frontStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
        });
        frontVideo.srcObject = frontStream;
        
        // 获取后置摄像头
        backStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        backVideo.srcObject = backStream;
        
        // 更新UI状态
        startBtn.disabled = true;
        stopBtn.disabled = false;
        captureBtn.disabled = false;
        statusText.textContent = '状态: 摄像头已启动';
    } catch (error) {
        console.error('摄像头启动失败:', error);
        statusText.textContent = `状态: 摄像头启动失败 - ${error.message}`;
    }
}

// 停止摄像头
function stopCameras() {
    if (frontStream) {
        frontStream.getTracks().forEach(track => track.stop());
        frontStream = null;
    }
    
    if (backStream) {
        backStream.getTracks().forEach(track => track.stop());
        backStream = null;
    }
    
    // 更新UI状态
    startBtn.disabled = false;
    stopBtn.disabled = true;
    captureBtn.disabled = true;
    statusText.textContent = '状态: 摄像头已停止';
}

// 拍照
function capturePhoto(type) {
    const video = type === 'front' ? frontVideo : backVideo;
    const canvas = type === 'front' ? frontCanvas : backCanvas;
    
    if (!video.srcObject) return;
    
    // 设置canvas尺寸与视频相同
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制当前帧到canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 更新计数
    photoCount++;
    countText.textContent = `已拍摄照片: ${photoCount}`;
    statusText.textContent = `状态: 已拍摄${type === 'front' ? '前置' : '后置'}照片`;
}

// 拍照并分析
function captureAndAnalyze() {
    // 拍摄两张新照片
    capturePhoto('front');
    capturePhoto('back');

    // if (frontCanvas.width === 0 || backCanvas.width === 0) {
    //     alert('请先拍摄前置和后置照片');
    //     return;
    // }
    
    // 获取图像数据
    const frontData = frontCanvas.toDataURL('image/jpeg');
    const backData = backCanvas.toDataURL('image/jpeg');
    
    // 发送到服务器进行分析
    socket.emit('analyze', {
        front: frontData,
        back: backData
    });
    
    statusText.textContent = '状态: 分析中...';
}

// 错误处理
navigator.mediaDevices.ondevicechange = () => {
    if ((frontStream && !frontStream.active) || (backStream && !backStream.active)) {
        stopCameras();
        statusText.textContent = '状态: 摄像头断开连接';
    }
};