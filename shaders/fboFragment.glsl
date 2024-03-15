varying vec2 vUv;
uniform sampler2D uPosTexture;
uniform sampler2D uOriginPosTexture;
uniform vec3 uMousePos;


void main() {
    vec4 pos = texture2D(uPosTexture, vUv);
    vec3 originPos = texture2D(uOriginPosTexture, vUv).xyz;

    // color.x += 0.01;
    vec3 force = pos.xyz-uMousePos;
    float len = length(force);
    float forceFractor = 1./max(0.1,len*50.);
    vec3 posToGo = originPos + normalize(force)*forceFractor;
    pos.xy += (posToGo.xy-pos.xy)*0.005;
  
    gl_FragColor = vec4( pos.xyz, 1.0 );
}  