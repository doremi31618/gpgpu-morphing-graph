varying vec2 vUv;
uniform float timeControl;
uniform sampler2D uPosTexture;
uniform sampler2D uOriginPosTexture;
uniform sampler2D uOriginPosTexture2;
uniform vec3 uMousePos;


void main() {
    vec4 pos = texture2D(uPosTexture, vUv);
    vec3 originPos = texture2D(uOriginPosTexture, vUv).xyz;
    vec3 originPos2 = texture2D(uOriginPosTexture2, vUv).xyz;

    vec3 mixPos = mix(originPos, originPos2, timeControl);
    // color.x += 0.01;
    vec3 force = pos.xyz-uMousePos;
    float len = length(force);
    float forceFractor = 0.5/max(1.,len*8.);
    vec3 posToGo = mixPos + normalize(force)*forceFractor;
    pos.xy += (posToGo.xy-pos.xy)*0.05;
  
    gl_FragColor = vec4( pos.xyz, 1.0 );
}  