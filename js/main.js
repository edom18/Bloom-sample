(function () {
    'use strict';

    var canvas = document.createElement('canvas');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    var gl = canvas.getContext('webgl');

    var vsSource = document.getElementById('vs').innerHTML;
    var fsSource = document.getElementById('fs').innerHTML;


    function main() {
        var program = compileShader(gl, vsSource, fsSource);

        // position
        {
            var positionData = [
                -1.0,  1.0, 0.0,
                 1.0,  1.0, 0.0,
                -1.0, -1.0, 0.0, 
                 1.0, -1.0, 0.0
            ];
            var positionVBO = createVBO(gl, positionData);
            var positionLocation = gl.getAttribLocation(program, 'position');
            gl.bindBuffer(gl.ARRAY_BUFFER, positionVBO);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        // color
        {
            var colorData = [
                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0
            ];
            var colorLocation = gl.getAttribLocation(program, 'color');
            var colorVBO = createVBO(gl, colorData);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorVBO);
            gl.enableVertexAttribArray(colorLocation);
            gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
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
            var textureCoordLocation = gl.getAttribLocation(program, 'textureCoord');
            var textureCoordVBO = createVBO(gl, textureCoordData);
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordVBO);
            gl.enableVertexAttribArray(textureCoordLocation);
            gl.vertexAttribPointer(textureCoordLocation, 2, gl.FLOAT, false, 0, 0);
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
        var matrixLocation  = gl.getUniformLocation(program, 'mvpMatrix');
        var textureLocation = gl.getUniformLocation(program, 'texture');

        var mMatrix = mat4();
        var vMatrix = mat4();
        var pMatrix = mat4();
        var tmpMatrix = mat4();
        var mvpMatrix = mat4();

        vMatrix = mat4.lookAt(vec3( 0.0, 2.0, 5.0 ), vec3(0, 0, 0), vec3(0, 1, 0));
        pMatrix = mat4.perspective(60, canvas.width / canvas.height, 0.1, 100);
        tmpMatrix = mat4.multiply(pMatrix, vMatrix);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);


        var img = new Image();
        img.onload = function() {
            gl.activeTexture(gl.TEXTURE0);
            var texture = createTexture(gl, this);
            runLoop();
        };
        img.src = 'img/texture.png';

        var count = 0;
        function runLoop() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            count += 0.5;
            var rad = (count % 360) * Math.PI / 180;

            // gl.uniformMatrix4fv();
            gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

            gl.flush();
        }
    }

    main();
}());
