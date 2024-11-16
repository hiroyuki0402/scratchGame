document.addEventListener('DOMContentLoaded', function() {
    /// HTMLからcanvas要素を取得
    const canvas = document.getElementById('scratchCanvas');
    /// canvasから2Dコンテキストを取得
    const ctx = canvas.getContext('2d');

    /// ブラシのサイズとキャンバスの幅、高さを設定
    const brushSize = 30;
    const width = 300;
    const height = 200;

    /// デフォルトのテキストカラー
    let textColor = 'black';

    /// 描画中の状態を追跡
    let isDrawing = false;

    /// 結果のテキストを格納する変数を宣言
    let resultText = '';

    /// キャンバスの幅と高さを設定
    canvas.width = width;
    canvas.height = height;

    /// サーバーから結果を取得
    fetch('/getResult')
        .then(response => response.json())
        .then(data => {
            /// サーバーから取得した結果に応じてテキストを設定
            if (data.result === 'win') {
                resultText = 'あたり！';
                textColor = 'green';
            } else if (data.result == 'lose') {
                resultText = 'ハズレ';
                textColor = 'red';
            } 

            /// 初期描画を実行
            initializeCanvas();
        })
        .catch(error => { 
            console.error('サーバーから結果を取得できませんでした:', error);
            // TODO:とりあえずランダムで
            resultText = Math.random() < 0.5 ? 'あたり！' : 'ハズレ';
            textColor = resultText == 'あたり！' ? 'green': 'red';
            initializeCanvas();
        });

    /// キャンバスの初期化と描画
    function initializeCanvas() {
        /// 背景を白で塗りつぶし
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        /// キャンバスにテキストを描画
        ctx.fillStyle = textColor;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(resultText, width / 2, height / 2);

        /// オフスクリーンキャンバスを作成してマスクとして使用
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');

        /// マスクを灰色で塗りつぶし
        maskCtx.fillStyle = '#888';
        maskCtx.fillRect(0, 0, width, height);

        /// 初期描画を更新
        updateCanvas(maskCtx);

        /// マウス移動時の挙動を管理
        function handleMouseMove(e) {
            /// 描画フラグがfalseの場合、処理を中断
            if (!isDrawing) return;

            /// キャンバス上のマウスの位置を計算
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);

            /// マスクに対してスクラッチ効果を適用
            maskCtx.globalCompositeOperation = 'destination-out';
            maskCtx.beginPath();
            maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
            maskCtx.fill();

            /// キャンバスを更新
            updateCanvas(maskCtx);

            /// スクラッチの進行度を更新
            updateReveal(maskCtx);
        }

        /// キャンバスを更新する関数
        function updateCanvas(maskCtx) {
            /// メインキャンバスをクリア
            ctx.clearRect(0, 0, width, height);

            /// 背景を白で塗りつぶし
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);

            /// テキストを描画
            ctx.fillStyle = textColor;  
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(resultText, width / 2, height / 2);

            /// マスクを重ね合わせ
            ctx.drawImage(maskCanvas, 0, 0);
        }

        /// スクラッチの進行度を計算
        function updateReveal(maskCtx) {
            /// マスクキャンバスからイメージデータを取得
            const imageData = maskCtx.getImageData(0, 0, width, height);
            const data = imageData.data;

            /// 透明ピクセルのカウントをリセット
            let revealed = 0;

            /// 全ピクセルを走査して透明ピクセルの数をカウント
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] === 0) revealed++;
            }

            /// スクラッチの閾値を超えたか判断
            const totalArea = width * height;
            const revealLimit = totalArea * 0.5; // 50%
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

        /// マウス移動に応じて描画処理を行う
        canvas.addEventListener('mousemove', handleMouseMove);
    }
});
