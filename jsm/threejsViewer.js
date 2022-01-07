import * as THREE from "../threejs/build/three.module.js";
import { MarchingCubes } from '../threejs/examples/jsm/objects/MarchingCubes.js'
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js'

class threejsViewer {
    constructor(domElement) {
        this.size = 0
        this.databuffer = null
        this.textureOption = 0
        this.threshold = 75
        this.enableLine = false

        let width = domElement.clientWidth;
        let height = domElement.clientHeight;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0xE6E6FA, 1.0)
        domElement.appendChild(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        let aspect = window.innerWidth / window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);
        this.camera.position.set(2, 1, 2)
        this.scene.add(this.camera)

        // Light
        let directionalLight = new THREE.DirectionalLight(0xffffff, 1)
        directionalLight.position.set(2, 1, 2)
        directionalLight.castShadow = true;
        this.scene.add(directionalLight)

        let pointLight = new THREE.PointLight(0xff3300);
        pointLight.position.set(0, 0, 100);
        this.scene.add(pointLight);


        let ambientLight = new THREE.AmbientLight(0x555555);
        this.scene.add(ambientLight);

        // Controller
        let controller = new OrbitControls(this.camera, this.renderer.domElement)
        controller.target.set(0, 0.5, 0)
        controller.update()

        //Axis Landmark
        const axesHelper = new THREE.AxesHelper(100)
        this.scene.add(axesHelper)

        // Ground
        const plane = new THREE.Mesh(
            new THREE.CircleGeometry(2, 30),
            new THREE.MeshPhongMaterial({ color: 0xbbddff, opacity: 0.4, transparent: true })
        );
        plane.rotation.x = - Math.PI / 2;
        // this.scene.add(plane);

        let scope = this
        this.renderScene = function () {
            requestAnimationFrame(scope.renderScene)
            scope.renderer.render(scope.scene, scope.camera);
        }

        //視窗變動時 ，更新畫布大小以及相機(投影矩陣)繪製的比例
        window.addEventListener('resize', () => {
            //update render canvas size
            let width = domElement.clientWidth
            let height = domElement.clientHeight
            this.renderer.setSize(width, height);

            //update camera project aspect
            this.camera.aspect = width / height
            this.camera.updateProjectionMatrix();
        })

        this.renderScene()

        let effect = null;
        let wireframe = null;

        this.updateThreshold = (value) => {
            effect.isolation = value
            effect.remove(wireframe);
            let geo = new THREE.EdgesGeometry(effect.generateGeometry()); // or WireframeGeometry
            let mat = new THREE.LineBasicMaterial({ color: 0x0000ff });
            wireframe = new THREE.LineSegments(geo, mat);
            wireframe.visible = this.enableLine
            effect.add(wireframe);
        }

        this.updateColor = (name) => {
            effect.material = this.materials[name]
        }

        this.getMesh = () => new THREE.Mesh(effect.generateGeometry());

        this.toggleWireframe = () => {
            this.enableLine = !this.enableLine;
            wireframe.visible = this.enableLine
        }

        this.setMarchingCube = (maxDim, type, arr) => {
            this.scene.remove(effect);
            effect = new MarchingCubes(maxDim, this.materials['normal'], false, false, 100000);
            console.log(arr);
            // console.log("converting array")
            // let intArray = new Uint8Array(arr);
            // console.log(intArray);
            // let floatArray =new Float32Array(intArray.map(x=>[x,x,x]).flat());
            // console.log(floatArray);
            // effect.material = new THREE.MeshNormalMaterial();
            effect.isolation = this.threshold;
            effect.field = arr;
            effect.position.set(0, 1, 0);
            effect.material.wireframe = true;

            // effect.normal_cache = floatArray;

            // // effect.enableUvs = false;
            // // effect.enableColors = false;
            let geo = new THREE.EdgesGeometry(effect.generateGeometry()); // or WireframeGeometry
            let mat = new THREE.LineBasicMaterial({ color: 0x0000ff });
            wireframe = new THREE.LineSegments(geo, mat);
            wireframe.visible = this.enableLine
            effect.add(wireframe);

            this.scene.add(effect);
            console.log(effect)
        }


        const path = 'reff/';
        const format = '.jpg';
        const urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];

        const cubeTextureLoader = new THREE.CubeTextureLoader();

        const reflectionCube = cubeTextureLoader.load(urls);
        const refractionCube = cubeTextureLoader.load(urls);
        refractionCube.mapping = THREE.CubeRefractionMapping;

        // const materials = {
        //     'shiny': new THREE.MeshStandardMaterial( { color: 0x550000, envMap: reflectionCube, roughness: 0.1, metalness: 1.0 } ),
        //     'chrome': new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } ),
        //     'liquid': new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: refractionCube, refractionRatio: 0.85 } ),
        //     'matte': new THREE.MeshPhongMaterial( { specular: 0x111111, shininess: 1 } ),
        //     'flat': new THREE.MeshLambertMaterial( { /*TODO flatShading: true */ } ),
        //     'textured': new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 1, map: texture } ),
        //     'colors': new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 2, vertexColors: true } ),
        //     'multiColors': new THREE.MeshPhongMaterial( { shininess: 2, vertexColors: true } ),
        //     'plastic': new THREE.MeshPhongMaterial( { specular: 0x888888, shininess: 250 } ),
        //     'toon1': toonMaterial1,
        //     'toon2': toonMaterial2,
        //     'hatching': hatchingMaterial,
        //     'dotted': dottedMaterial
        // };
        this.materials = {
            'shiny': new THREE.MeshStandardMaterial({ color: 0x550000, envMap: reflectionCube, roughness: 0.1, metalness: 1.0 }),
            'chrome': new THREE.MeshLambertMaterial({ color: 0xffffff, envMap: reflectionCube }),
            'normal': new THREE.MeshNormalMaterial(),
            'matte': new THREE.MeshPhongMaterial({ specular: 0x111111, shininess: 1 }),
            'red': new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0xeeeeee, shininess: 100, vertexColors: false }),
            'green': new THREE.MeshPhongMaterial({ color: 0x00ff00, specular: 0xeeeeee, shininess: 100, vertexColors: false }),
            'plastic': new THREE.MeshPhongMaterial({ specular: 0x888888, shininess: 250 })
        };
    }
}

export {
    threejsViewer
}
