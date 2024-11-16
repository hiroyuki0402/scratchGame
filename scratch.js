document.addEventListener('DOMContentLoaded', function() {
    /// HTMLからcanvas要素を取得
    const canvas = document.getElementById('scratchCanvas');
    /// canvasから2Dコンテキストを取得
    const ctx = canvas.getContext('2d');

    /// ブラシのサイズを設定
    const brushSize = (canvas.height / canvas.width) * 100;

    /// 描画中の状態を追跡
    let isDrawing = false;

    /// デフォルトのテキストカラー
    let textColor = 'black';

    /// フォント
    const fontSize = canvas.width * 0.3
    const font =  `bold ${fontSize}px Arial`

    /// 結果のテキストを格納する変数を宣言
    let resultText = '';

    /// ウィンドウサイズに応じてキャンバスのサイズを設定する関数
    function resizeCanvas() {
        /// キャンバスの幅をウィンドウ幅から左右の余白を引いた値に設定
        const canvasWidth = window.innerWidth - 40; // 左右の余白20pxずつ
        /// キャンバスの高さをウィンドウ高さの1/3に設定
        const canvasHeight = window.innerHeight / 3;

        /// キャンバスのサイズを更新
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        /// 初期描画を実行
        initializeCanvas();
    }

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

            /// キャンバスのサイズをリサイズ
            resizeCanvas();
        })
        .catch(error => { 
            console.error('サーバーから結果を取得できませんでした:', error);
            /// とりあえずランダムで結果を設定
            resultText = Math.random() < 0.5 ? 'あたり！' : 'ハズレ';
            textColor = resultText == 'あたり！' ? 'green': 'red';
            resizeCanvas();
        });

    /// ウィンドウサイズ変更時にキャンバスをリサイズ
    window.addEventListener('resize', resizeCanvas);

    /// キャンバスの初期化と描画
    function initializeCanvas() {
        /// 背景を白で塗りつぶし
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        /// キャンバスにテキストを描画
        ctx.fillStyle = textColor;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(resultText, canvas.width / 2, canvas.height / 2);

        /// オフスクリーンキャンバスを作成してマスクとして使用
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');

        /// マスクを灰色で塗りつぶし
        maskCtx.fillStyle = '#888';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        /// 初期描画を更新
        updateCanvas(maskCtx);

        /// マウスおよびタッチ移動時の挙動を管理
        function handleMove(e) {
            /// 描画フラグがfalseの場合、処理を中断
            if (!isDrawing) return;

            /// デフォルトの動作をキャンセル
            e.preventDefault();

            /// タッチイベントの場合、最初のタッチ点を使用
            let clientX, clientY;
            if (e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            /// キャンバス上の座標を計算
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * (canvas.width / rect.width);
            const y = (clientY - rect.top) * (canvas.height / rect.height);

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
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            /// 背景を白で塗りつぶし
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            /// テキストを描画
            ctx.fillStyle = textColor;  
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(resultText, canvas.width / 2, canvas.height / 2);

            /// マスクを重ね合わせ
            ctx.drawImage(maskCanvas, 0, 0);
        }

        /// スクラッチの進行度を計算
        function updateReveal(maskCtx) {
            /// マスクキャンバスからイメージデータを取得
            const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const data = imageData.data;

            /// 透明ピクセルのカウントをリセット
            let revealed = 0;

            /// 全ピクセルを走査して透明ピクセルの数をカウント
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] === 0) revealed++;
            }

            /// スクラッチの閾値を超えたか判断
            const totalArea = maskCanvas.width * maskCanvas.height;
            const revealLimit = totalArea * 0.2; // 50%
            if (revealed >= revealLimit) {
                /// 特典表示ボタンを表示
                document.getElementById('revealButton').style.display = 'block';
            }
        }

        /// 描画を開始する関数
        function startDrawing(e) {
            isDrawing = true;
            /// デフォルトの動作をキャンセル（スクロール防止など）
            e.preventDefault();
        }

        /// 描画を停止する関数
        function stopDrawing(e) {
            isDrawing = false;
            /// デフォルトの動作をキャンセル
            e.preventDefault();
        }

        /// マウスおよびタッチイベントを登録
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('mousemove', handleMove);

        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);
        canvas.addEventListener('touchmove', handleMove);
    }
});
