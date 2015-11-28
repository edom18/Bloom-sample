(function (ns) {
    'use strict';

    /**
     * Compile a shader
     *
     * @param {WebGL.context} gl
     * @param {String} vssource Vertex shader source
     * @param {String} fssource Fragment shader source
     *
     * @return {WebGL.Program}
     */
    function compileShader(gl, vsSource, fsSource) {
        var vs = createShader(gl, 'vertex-shader',   vsSource);
        var fs = createShader(gl, 'fragment-shader', fsSource);
        return createProgram(gl, vs, fs);
    }

    /**
     * Create a shader
     *
     * @param {WebGL.context} gl
     * @param {String} type Shader type
     * @param {String} source Shader source
     *
     * @return {WebGL.Shader}
     */
    function createShader(gl, type, source) {
        var shader;

        if (type === 'vertex-shader') {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }
        else if (type === 'fragment-shader') {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log('Faile to compile shaders. ', gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    /**
     * Create a program
     *
     * @param {WebGL.context} gl
     * @param {WebGL.Shader} vs Vertex shader
     * @param {WebGL.Shader} fs Fragment shader
     *
     * @return {WebGL.Program}
     */
    function createProgram(gl, vs, fs) {
        var program = gl.createProgram();

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log('Failed to link shaders. ', gl.getProgramInfoLog(program));
            return null;
        }

        gl.useProgram(program);
        return program;
    }


    /**
     * Create a VBO
     *
     * @param {WebGL.context} gl
     * @param {Array} data Buffer data
     *
     * @return {WebGL.Buffer}
     */
    function createVBO(gl, data) {
        var vbo = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vbo;
    }


    /**
     * Create a IBO
     *
     * @param {WebGL.context} gl
     * @param {Array} data Buffer data
     *
     * @return {WebGL.Buffer}
     */
    function createIBO(gl, data) {
        var ibo = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }


    /**
     * Create a texture
     *
     * @param {WebGL.context} gl
     * @param {HTMLImage} source
     *
     * @return {WebGL.Texture}
     */
    function createTexture(gl, source) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    function createFramebuffer(gl, width, height) {
        var framebuffer = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // var depthBuffer = gl.createRenderbuffer();
        // gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {
            framebuffer: framebuffer,
            texture    : texture
        };
    }

    // Exports
    ns.compileShader = compileShader;
    ns.createShader  = createShader;
    ns.createProgram = createProgram;
    ns.createVBO     = createVBO;
    ns.createIBO     = createIBO;
    ns.createTexture = createTexture;
    ns.createFramebuffer = createFramebuffer;

}(window));
