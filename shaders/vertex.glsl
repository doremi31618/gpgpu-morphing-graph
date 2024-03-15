uniform float time;
uniform sampler2D uTexture;
varying vec2 vUv;


void main() {

    vUv = uv;

    vec3 newpos = texture2D(uTexture, uv).xyz;

    vec4 mvPosition = modelViewMatrix * vec4( newpos, 1.0 );

    gl_PointSize =  5.0;

    gl_Position = projectionMatrix * mvPosition;

}