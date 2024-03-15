varying vec2 vUv;

void main() {

    vUv = uv;
    // vec3 newpos = position;
    // newpos.z += sin(time + position.x) * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    gl_PointSize =  5.0;

    gl_Position = projectionMatrix * mvPosition;

}