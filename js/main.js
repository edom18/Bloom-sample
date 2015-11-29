(function () {
    'use strict';

    var canvas = document.createElement('canvas');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var gl = canvas.getContext('webgl');

    var vsSource0 = document.getElementById('brightness-vs').innerHTML;
    var fsSource0 = document.getElementById('brightness-fs').innerHTML;

    var vsSource1 = document.getElementById('vs').innerHTML;
    var fsSource1 = document.getElementById('fs').innerHTML;

    var vsSource2 = document.getElementById('bloom-vs').innerHTML;
    var fsSource2 = document.getElementById('bloom-fs').innerHTML;

    var vsSource3 = document.getElementById('result-vs').innerHTML;
    var fsSource3 = document.getElementById('result-fs').innerHTML;

    function main() {
        var program0 = compileShader(gl, vsSource0, fsSource0);
        var program1 = compileShader(gl, vsSource1, fsSource1);
        var program2 = compileShader(gl, vsSource2, fsSource2);
        var program3 = compileShader(gl, vsSource3, fsSource3);

        // position
        {
            var positionData = [
                -1.0,  1.0, 0.0,
                 1.0,  1.0, 0.0,
                -1.0, -1.0, 0.0, 
                 1.0, -1.0, 0.0
            ];
            var positionVBO = createVBO(gl, positionData);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionVBO);

            var positionLocation0 = gl.getAttribLocation(program0, 'position');
            gl.enableVertexAttribArray(positionLocation0);
            gl.vertexAttribPointer(positionLocation0, 3, gl.FLOAT, false, 0, 0);

            var positionLocation1 = gl.getAttribLocation(program1, 'position');
            gl.enableVertexAttribArray(positionLocation1);
            gl.vertexAttribPointer(positionLocation1, 3, gl.FLOAT, false, 0, 0);

            var positionLocation2 = gl.getAttribLocation(program2, 'position');
            gl.enableVertexAttribArray(positionLocation2);
            gl.vertexAttribPointer(positionLocation2, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        // color
        {
            var colorData = [
                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.5, 0.5, 0.5, 1.0
            ];
            var colorVBO = createVBO(gl, colorData);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorVBO);

            var colorLocation1 = gl.getAttribLocation(program1, 'color');
            gl.bindBuffer(gl.ARRAY_BUFFER, colorVBO);
            gl.enableVertexAttribArray(colorLocation1);
            gl.vertexAttribPointer(colorLocation1, 4, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        // texture
        {
            var textureCoordData = [
                0.0, 0.0, 
                1.0, 0.0, 
                0.0, 1.0, 
                1.0, 1.0
            ];
            var textureCoordVBO = createVBO(gl, textureCoordData);
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordVBO);

            var textureCoord0 = gl.getAttribLocation(program0, 'textureCoord');
            gl.enableVertexAttribArray(textureCoord0);
            gl.vertexAttribPointer(textureCoord0, 2, gl.FLOAT, false, 0, 0);

            var textureCoord1 = gl.getAttribLocation(program1, 'textureCoord');
            gl.enableVertexAttribArray(textureCoord1);
            gl.vertexAttribPointer(textureCoord1, 2, gl.FLOAT, false, 0, 0);

            var textureCoord2 = gl.getAttribLocation(program2, 'textureCoord');
            gl.enableVertexAttribArray(textureCoord2);
            gl.vertexAttribPointer(textureCoord2, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        // index
        {
            var indexData = [
                0, 1, 2,
                3, 2, 1
            ];
            var indexIBO = createIBO(gl, indexData);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexIBO);
        }

        // Uniform
        var matrixLocation  = gl.getUniformLocation(program1, 'mvpMatrix');
        var textureLocation0 = gl.getUniformLocation(program0, 'texture');
        var textureLocation1 = gl.getUniformLocation(program1, 'texture');
        var textureLocation2 = gl.getUniformLocation(program2, 'texture');

        var minBrightLocation = gl.getUniformLocation(program0, 'minBright');

        var offsetsLocationH = gl.getUniformLocation(program2, 'offsetsH');
        var weightsLocationH = gl.getUniformLocation(program2, 'weightsH');
        var offsetsLocationV = gl.getUniformLocation(program2, 'offsetsV');
        var weightsLocationV = gl.getUniformLocation(program2, 'weightsV');

        // Setup matricies
        {
            var mMatrix = mat4();
            var vMatrix = mat4();
            var pMatrix = mat4();
            var tmpMatrix = mat4();
            var mvpMatrix = mat4();

            vMatrix = mat4.lookAt(vec3( 0.0, 0.0, 5.0 ), vec3(0, 0, 0), vec3(0, 1, 0));
            pMatrix = mat4.perspective(60, canvas.width / canvas.height, 0.1, 100);
            tmpMatrix = mat4.multiply(pMatrix, vMatrix);
        }

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);


        // var offscreen = createFramebuffer(gl, window.innerWidth, window.innerHeight);

        var texture;
        var rad = 10 * Math.PI / 180;

        var captureScreen = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, captureScreen);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Sampling
        var SAMPLE_COUNT = 25;

        var offsetH = new Array(SAMPLE_COUNT);
        var weightH = new Array(SAMPLE_COUNT);
        {
            var offsetTmp = new Array(SAMPLE_COUNT);
            var total = 0;

            for (var i = 0; i < SAMPLE_COUNT; i++) {
                var p = (i - (SAMPLE_COUNT - 1) * 0.5) * 0.0006;
                offsetTmp[i] = p;
                weightH[i] = Math.exp(-p * p / 2) / Math.sqrt(Math.PI * 2);
                total += weightH[i];
            }
            for (var i = 0; i < SAMPLE_COUNT; i++) {
                weightH[i] /= total;
            }
            var tmp = [];
            for (var key in offsetTmp) {
                tmp.push(offsetTmp[key], 0);
            }
            offsetH = new Float32Array(tmp);
        }

        var offsetV = new Array(SAMPLE_COUNT);
        var weightV = new Array(SAMPLE_COUNT);
        {
            var offsetTmp = new Array(SAMPLE_COUNT);
            var total = 0;

            for (var i = 0; i < SAMPLE_COUNT; i++) {
                var p = (i - (SAMPLE_COUNT - 1) * 0.5) * 0.0006;
                offsetTmp[i] = p;
                weightV[i] = Math.exp(-p * p / 2) / Math.sqrt(Math.PI * 2);
                total += weightV[i];
            }
            for (var i = 0; i < SAMPLE_COUNT; i++) {
                weightV[i] /= total;
            }
            var tmp = [];
            for (var key in offsetTmp) {
                tmp.push(0, offsetTmp[key]);
            }
            offsetV = new Float32Array(tmp);
        }

        function runLoop() {
            // Pass
            {
                // メインシーンをレンダリング

                // メインシーン用プログラムを使用
                gl.useProgram(program1);

                // デバイス用のバッファにレンダリングするためframebufferをnullに
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                // クリアを実行
                gl.clearColor(0.3, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // モデルの状態をアップデート
                // mat4.rotate(mMatrix, rad, vec3(0, 1, 0), mMatrix);
                mat4.multiply(tmpMatrix, mMatrix, mvpMatrix);

                // uniform変数にデータをアップロード
                gl.uniformMatrix4fv(matrixLocation, false, mvpMatrix);;

                // 0番のテクスチャをアクティブに
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(textureLocation1, 0);

                // メインシーンをdraw
                gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
            }

            // Pass
            {

                // 現在のバッファの状態をコピー
                // 1番のテクスチャにコピーする（上記でテクスチャ使い終わっているから要らない処理）
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, captureScreen);
                gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, window.innerWidth, window.innerHeight, 0);

                gl.useProgram(program0);
                // gl.bindFramebuffer(gl.FRAMEBUFFER, offscreen.framebuffer);

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                gl.uniform1i(textureLocation0, 1);
                gl.uniform1f(minBrightLocation, 0.7);

                gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
            }

            // Pass
            {
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, captureScreen);
                gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, window.innerWidth, window.innerHeight, 0);

                gl.useProgram(program2);

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                gl.uniform1i(textureLocation2, 2);

                gl.uniform2fv(offsetsLocationH, offsetH);
                gl.uniform1fv(weightsLocationH, weightH);

                gl.uniform2fv(offsetsLocationV, offsetV);
                gl.uniform1fv(weightsLocationV, weightV);

                gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
            }


            gl.flush();

            requestAnimationFrame(runLoop);
        }


        // Load a texture.
        var img = new Image();
        img.onload = function() {
            gl.activeTexture(gl.TEXTURE0);
            texture = createTexture(gl, this);
            runLoop();
        };
        img.src = 'img/texture.png';
    }

    main();
}());
