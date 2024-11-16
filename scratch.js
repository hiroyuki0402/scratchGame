document.addEventListener('DOMContentLoaded', function() {
    /// HTMLからcanvas要素を取得
    const canvas = document.getElementById('scratchCanvas');

    /// canvasから2Dコンテキストを取得
    const ctx = canvas.getContext('2d');

    /// ブラシのサイズとキャンバスの幅、高さを設定
    const brushSize = 30;
    const width = 300;
    const height = 200;

    /// スクラッチされた領域のカウントを保持
    let revealed = 0;

    /// 描画中の状態を追跡
    let isDrawing = false;
  
    /// キャンバスの幅と高さを設定
    canvas.width = width;
    canvas.height = height;
  
    /// キャンバスを初期の灰色で塗りつぶ
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, width, height);
  
    /// 透明ピクセルの数を計算する基準を設定
    const totalArea = width * height;
    const revealLimit = totalArea * 0.5; // 50%
  
    /// マウス移動時の挙動を管理
    function handleMouseMove(e) {
        /// 描画フラグがfalseの場合、処理を中断
        if (!isDrawing) return;

        /// キャンバス上のマウスの位置を計算
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
  
        /// 描画モードを透明に設定
        ctx.globalCompositeOperation = 'destination-out';

        /// パスを開始
        ctx.beginPath();

        /// マウスの位置に円を描画
        ctx.arc(x, y, brushSize, 0, Math.PI * 2);

        /// 描画内容をキャンバスに適用
        ctx.fill();
  
        /// スクラッチの進行度を更新
        updateReveal();
    }
  
    /// スクラッチの進行度を計算
    function updateReveal() {
        /// キャンバスからイメージデータを取得
        const imageData = ctx.getImageData(0, 0, width, height);

        /// データ配列を解析
        const data = imageData.data;

        /// 透明ピクセルのカウントをリセット
        revealed = 0;
  
        /// 全ピクセルを走査して透明ピクセルの数をカウント
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] === 0) revealed++;
        }
  
        /// スクラッチの閾値を超えたか判断
        if (revealed >= revealLimit) {
            /// 特典表示ボタンを表示
            document.getElementById('revealButton').style.display = 'block';
        }
    }
  
    /// マウスボタンが押された時に描画を開始
    canvas.addEventListener('mousedown', function() {
        isDrawing = true;
    });
  
    /// マウスボタンが離された時に描画を停止
    canvas.addEventListener('mouseup', function() {
        isDrawing = false;
    });
  
    /// キャンバスからマウスが離れた時に描画を停止
    canvas.addEventListener('mouseleave', function() {
        isDrawing = false;
    });
  
    /// マウス移動に応じて描画処理を行っている
    canvas.addEventListener('mousemove', handleMouseMove);
});
