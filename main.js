import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

import fboVertex from './shaders/fboVertex.glsl';
import fboFragment from './shaders/fboFragment.glsl';



export default class Sketch{
  constructor({dom}){
    this.container=dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    //init renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha : true,
      antialias: true
    })
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    
    //init camera
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 0.01, 10);
    this.camera.position.z = 1;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    this.createPositionBuffer();
    this.setupMouseEvent()
    this.addObject();
    this.setupFBO();//setting up compute shader 
    this.setupResize();
    this.render();
  }
  setupMouseEvent(){
    this.uMousePos = new THREE.Vector3(0,0,0);

    this.raycastMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10,10),
      new THREE.MeshBasicMaterial()
    )
    window.addEventListener('pointermove', (e)=>{
      this.pointer.x = (e.clientX/this.width) * 2 - 1;
      this.pointer.y = -(e.clientY/this.height) * 2 + 1;
      this.raycaster.setFromCamera( this.pointer, this.camera );
      const intersects = this.raycaster.intersectObjects([this.raycastMesh]);
      if (intersects.length>0){
        // console.log(intersects[0].point);
        this.uMousePos = intersects[0].point;
        this.matFBO.uniforms.uMousePos.value = this.uMousePos;
      }

    })
  }
  createPositionBuffer(){
    this.size = 32;
    this.number = this.size * this.size;

    this.positions = new Float32Array(this.number * 4);
    for(let i=0; i<this.size; i++){
      for(let j=0; j<this.size; j++){
        let index = i * this.size + j;
        this.positions[index * 4 ] = i/(this.size-1) - 0.5;
        this.positions[index * 4 + 1] = j/(this.size-1) -0.5;
        this.positions[index * 4 + 2] = 0;
        this.positions[index * 4 + 3] = 1;
      }
    }
    this.positionTexture = new THREE.DataTexture(this.positions,this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
    this.positionTexture.needsUpdate = true;

  }
  setupFBO(){
    this.sceneFBO = new THREE.Scene();
    this.cameraFBO = new THREE.OrthographicCamera(-1,1,1,-1,0, 1);
    this.cameraFBO.position.z = 1;
    this.cameraFBO.lookAt(new THREE.Vector3(0,0,0));

    

    this.geoFBO = new THREE.PlaneGeometry(2,2);
    this.matFBO = new THREE.ShaderMaterial({
      uniforms: {
        uMousePos: {value: this.uMousePos},
        uPosTexture: {value: this.positionTexture},
        uOriginPosTexture: {value: this.positionTexture}
      },
      vertexShader:fboVertex,
      fragmentShader:fboFragment, 
    })
    this.meshFBO = new THREE.Mesh(this.geoFBO, this.matFBO);
    // this.meshFBO.position.x = 0.5;
    this.sceneFBO.add(this.meshFBO);

    //the output image format
    /*
       * .magFilter : number (THREE.LinearFilter or THREE.NearestFilter)
       * How the texture is sampled when a texel covers more than one pixel. The default is THREE.LinearFilter, which takes the four closest texels and bilinearly interpolates among them. The other option is THREE.NearestFilter, which uses the value of the closest texel.
       * See the texture constants page for details.

       * .minFilter : number (THREE.LinearFilter or THREE.NearestFilter)
       * How the texture is sampled when a texel covers less than one pixel. The default is THREE.LinearMipmapLinearFilter, which uses mipmapping and a trilinear filter.
       * 
       * type : number() (THREE.UnsignedByteType 
              THREE.ByteType 
              THREE.ShortType
              THREE.UnsignedShortType 
              THREE.IntType 
              THREE.UnsignedIntType
              THREE.FloatType 
              THREE.HalfFloatType 
              THREE.UnsignedShort4444Type
              THREE.UnsignedShort5551Type 
              THREE.UnsignedInt248Type)
       * This must correspond to the .format. The default is THREE.UnsignedByteType, which will be used for most texture formats.
       */
    this.renderTarget = new THREE.WebGLRenderTarget(this.size,this.size,{
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType
      
    })
    this.renderTarget2 = new THREE.WebGLRenderTarget(this.size,this.size,{
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType
      
    })
    

  }
  setupResize(){
    // window.addEventListener('resize', this.resize.bind(this));
    this.container.addEventListener('resize', this.resize.bind(this));
  }
  resize(){
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width/this.height;

    this.camera.updateProjectionMatrix()
    
  }
  addObject(){
    //add object geometry -> material -> mesh -> add to scene
    this.geometry = new THREE.PlaneGeometry(10,10,50,50);
    this.material = new THREE.MeshNormalMaterial();
    
    this.time = 0;
    this.material = new THREE.ShaderMaterial({
        uniforms: {
            time: {value: this.time},
            uTexture: this.positionTexture
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    })
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);

  }
  render(){
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.sceneFBO, this.cameraFBO);
    
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    const tmpRenderTarget = this.renderTarget;
    this.renderTarget = this.renderTarget2;
    this.renderTarget2 = tmpRenderTarget;
    
    this.material.uniforms.uTexture.value = this.renderTarget.texture;
    this.matFBO.uniforms.uPosTexture.value =  tmpRenderTarget.texture;
    
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  dom: document.querySelector('#container')
})