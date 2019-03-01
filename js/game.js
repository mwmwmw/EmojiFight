const MARKER_PATTERN_DATA = "./data/pattern-marker.patt";
const CAMERA_PATTERN_DATA = "./data/camera_para.dat";

const AR_TYPES = {
    WEBCAM: "webcam",
    VIDEO: "video",
}

const EVENTS = {
    INITIALIZE_AR: "initialize AR",
    AR_INITIALIZED: "AR initialized",
    LOAD_ASSETS: "LoadAssets",
    ASSETS_READY: "AssetsReady",
    SETUP_GAME: "SetupGame",
    START_GAME: "StartGame",
    START_LEVEL: "StartLevel",
    WIN_LEVEL: "WinLevel",
    ENEMY_HIT: "Hit",
    ENEMY_DEAD: "Dead",
    NEXT_LEVEL: "NextLevel",
    GAME_COMPLETE: "GameComplete",
    PLAY_SOUND: "PlaySound",
}

const NO_AR_VIDEO = "./images/testvid.mp4";

const kickout = (name, data = null, elm = window) => elm.dispatchEvent(new CustomEvent(name, { detail: data }));

let assetList = [
    "burger",
    "fire",
    "key",
    "lion",
    "lock",
    "poo",
    "soccer",
    "toilet",
    "trophy",
    "water",
    "net",
];


class SoundPlayer {

    constructor (assetList, camera) {


        this.sound = {};

        this.listener = new THREE.AudioListener();

        camera.add(this.listener);

        var player = this;

        assetList.map(s=>{

            var audioLoader = new THREE.AudioLoader();
            audioLoader.load( `./sound/${s}.mp3`, function( buffer ) {
                var sound = new THREE.Audio( player.listener );
                sound.setBuffer( buffer );
                sound.setLoop( false );
                sound.setVolume( 0.8 );
                player.sound[s] = sound;
            });

        });

        window.addEventListener(EVENTS.PLAY_SOUND, this.play.bind(this))

    }

    play(e) {
        const key = e.detail;
        const sound = this.sound[key];

       

        //sound.stop();
        if(sound.isPlaying) {
            sound.stop();
        }
        sound.detune = Math.floor(((0.5-Math.random())*2)*300);

        sound.play();

    }

}




class Level {
    constructor (enemyMesh, weaponMesh, text, details) {
        this.dead = false;
        this.state = "started"
        this.root = new THREE.Group();
        this.enemyMesh = enemyMesh.clone();
        this.weaponMesh = weaponMesh.clone();
        this.enemyMesh.geometry = this.enemyMesh.geometry.clone().translate(0,0.5,0);
        this.text = text.clone();
        this.details = details;
        this.progressBar = new ProgressBar(details)



        this.root.add(this.enemyMesh, this.text, this.progressBar.mesh);

        this.end = this.end.bind(this);

        window.addEventListener(EVENTS.ENEMY_DEAD, this.end);

        this.start();

    }
    start () { 
        kickout(EVENTS.START_LEVEL, this)
    }
    update () { 

        this.progressBar.update();
    
        // if(this.progressBar.inZone) {
            
        // }

        if(this.state === "won") {
            this.text.position.y+=0.05;
            this.text.rotateY(0.05);
            this.enemyMesh.rotateY(-0.1);
            this.enemyMesh.position.y-=0.08;
        }

    }

    end () {
        window.removeEventListener(EVENTS.ENEMY_DEAD, this.end);
        this.state = "won"
        kickout(EVENTS.WIN_LEVEL, this);
        setTimeout(()=>{
            kickout(EVENTS.NEXT_LEVEL);
            this.dead = true;
            this.cleanUp();
        }, 2000);
    }
    cleanUp () {
        kickout(EVENTS.REMOVE, this.root);
        this.root.parent.remove(this.root);
    }
}

class LionLevel extends Level {}
class LockLevel extends Level {}
class FireLevel extends Level {}
class ToiletLevel extends Level {}
class TrophyLevel extends Level {}
class Win extends Level {
    constructor () {
        super(...arguments)
        this.trophies = [];

        for(let i = 0; i < 100; i++) {
            let mesh = this.weaponMesh.clone();
            mesh.scale.set(0.2, 0.2, 0.2);
            mesh.position.set((0.5-Math.random())*5, Math.random()*5, (0.5-Math.random())*5);
            mesh.rng = 0.01 + Math.random()*0.07;
            this.trophies.push(mesh);
            this.root.add(mesh);
        }

    }
    start () { 
        kickout(EVENTS.START_LEVEL, this);
        this.progressBar.mesh.visible = false;
    }
    update () {

        this.trophies.map((t)=>{

            t.position.y -= 0.01;
            if(t.position.y < 0) {
                t.position.y = 5;
            }
            t.rotateZ(t.rng);
            t.rotateX(t.rng);
            t.rotateY(t.rng);

        })

        this.progressBar.update();
        let rotate = (this.progressBar.hits/this.progressBar.totalHits)*0.2;
        this.enemyMesh.rotateY(rotate);
    }

}

const LEVEL_TYPES = {
    NORMAL: "Normal",
    FINISH: "Finish",
}

const LEVELS = [
	{
        TYPE: LEVEL_TYPES.NORMAL,
		ENEMY: assetList[3], // Lion
		WEAPON: assetList[0],
        HEALTH: 300,
        SHOT_SIZE: 20,
        REGEN_RATE: 0.25,
		SWEET_SPOT: 200,
        SWEET_SPOT_SIZE: 95,
        LOCK_IN_TIME: 2000,
        LEVEL: LionLevel,
	},{
        TYPE: LEVEL_TYPES.NORMAL,
		ENEMY: assetList[4], // Lock
		WEAPON: assetList[2],
		HEALTH: 200,
        SHOT_SIZE: 5,
        REGEN_RATE: 0.03,
		SWEET_SPOT: 50,
        SWEET_SPOT_SIZE: 50,
        LOCK_IN_TIME: 2000,
        LEVEL: LockLevel,
	},{
        TYPE: LEVEL_TYPES.NORMAL,
		ENEMY: assetList[1], // Fire
		WEAPON: assetList[9],
		HEALTH: 100,
        SHOT_SIZE: 5,
        REGEN_RATE: 0.025,
		SWEET_SPOT: 90,
        SWEET_SPOT_SIZE: 10,
        LOCK_IN_TIME: 3000,
        LEVEL: FireLevel,
	},{
        TYPE: LEVEL_TYPES.NORMAL,
        ENEMY: assetList[7], // Toilet
        WEAPON: assetList[5],
        HEALTH: 1000,
        SHOT_SIZE: 10,
        REGEN_RATE: 0.25,
        SWEET_SPOT: 250,
        SWEET_SPOT_SIZE: 50,
        LOCK_IN_TIME: 2000,
        LEVEL: ToiletLevel,
    },{
        TYPE: LEVEL_TYPES.NORMAL,
        ENEMY: assetList[10], // Trophy
        WEAPON: assetList[6],
        HEALTH: 10,
        SHOT_SIZE: 1,
        REGEN_RATE: 0.025,
        SWEET_SPOT: 5,
        SWEET_SPOT_SIZE: 5,
        LOCK_IN_TIME: 500,
        LEVEL: TrophyLevel,
    },{
        TYPE: LEVEL_TYPES.FINISH,
        ENEMY: assetList[8], // Trophy
        WEAPON: assetList[8],
        HEALTH: 100,
        SHOT_SIZE: 10,
        REGEN_RATE: 0.2,
        SWEET_SPOT: 100,
        SWEET_SPOT_SIZE: 5,
        LOCK_IN_TIME: 500000,
        LEVEL: Win,
    },
];






class StartUpUI {

    constructor (Game) {

        
        this.setupScreen = document.getElementById("setupscreen");
        this.titleScreen = document.getElementById("titlescreen");

        this.loadingIndicator = document.getElementById("loading");
        this.startButton = document.getElementById("start");

        this.completeSetup = this.completeSetup.bind(this);
        this.loadingComplete = this.loadingComplete.bind(this);
        this.showTitle = this.showTitle.bind(this);

        this.setupScreen.addEventListener("touchstart", ()=> kickout(EVENTS.INITIALIZE_AR));
        this.setupScreen.addEventListener("click", ()=> kickout(EVENTS.INITIALIZE_AR));

        window.addEventListener(EVENTS.AR_INITIALIZED, this.completeSetup);
        window.addEventListener(EVENTS.ASSETS_READY, this.loadingComplete);
        
    }

    completeSetup () {
        this.setupScreen.classList.remove('show');
        this.setupScreen.classList.add("hide");
        this.titleScreen.classList.remove("hide");
        this.titleScreen.classList.add("show");
        window.removeEventListener(EVENTS.AR_INITIALIZED, this.completeSetup);
        kickout(EVENTS.LOAD_ASSETS);
    }

    showTitle () {
        this.titleScreen.classList.remove('show');
        this.titleScreen.classList.add("hide");
        setTimeout(()=>{
            document.getElementById("StartScreenUI").innerHTML = '';
            delete this;
        }, 4000)
        kickout(EVENTS.START_GAME);
    }

    loadingComplete () {
        this.titleScreen.addEventListener("touchstart", this.showTitle);
        this.titleScreen.addEventListener("click", this.showTitle);
        this.loadingIndicator.classList.add("hide");
        this.startButton.classList.remove("hide");
        window.removeEventListener(EVENTS.ASSETS_READY, this.loadingComplete);
    }

}

class ARManager {

    constructor () {

        this.markerRoot = new THREE.Group();
        this.scene = new THREE.Scene();

        let light = new THREE.HemisphereLight( 0xFFFFFF, 0x101010, 4. );
            light.position.y = 1;
        this.scene.add( light );
                    
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);
        this.scene.add(this.markerRoot);


        this.loading = true;
    
        let renderer = new THREE.WebGLRenderer({
            antialias : true,
            alpha: true
        });
        renderer.setClearColor(new THREE.Color('lightgrey'), 0)
        renderer.setSize( 640, 480 );
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '0px'
        renderer.domElement.style.left = '0px'
        document.body.appendChild( renderer.domElement );

        this.renderer = renderer;

        this.arToolkitSource = null;
        this.arToolkitContext = null;

        window.addEventListener(EVENTS.INITIALIZE_AR, this.initialize.bind(this));

    }

    onResize()
    {
        var {arToolkitContext, arToolkitSource} = this;
        arToolkitSource.onResize()	
        arToolkitSource.copySizeTo(this.renderer.domElement)	
        if ( arToolkitContext.arController !== null )
        {
            arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
        }	
    }


    initialize()
    {

        this.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType : AR_TYPES.WEBCAM,
            sourceUrl : NO_AR_VIDEO,
        });
    
        this.arToolkitSource.init(()=>{this.onResize()});

        window.addEventListener('resize', ()=>{this.onResize()});
        
        this.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: CAMERA_PATTERN_DATA,
            detectionMode: 'mono'
        });
        
        this.arToolkitContext.init( ()=>{
            this.camera.projectionMatrix.copy( this.arToolkitContext.getProjectionMatrix() );
        });
      
        this.markerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.markerRoot, {
            type: 'pattern', patternUrl: MARKER_PATTERN_DATA,
        })
    
       kickout(EVENTS.AR_INITIALIZED);

    }
    
}

class GameManager {

    constructor (levels) {
        this.levels = levels;



        window.addEventListener(EVENTS.START_GAME, this.startGame.bind(this));
        window.addEventListener(EVENTS.START_LEVEL, ()=>{});
        window.addEventListener(EVENTS.WIN_LEVEL, this.endLevel.bind(this));
        window.addEventListener(EVENTS.NEXT_LEVEL, this.nextLevel.bind(this))

        this.AR = new ARManager();
        this.hostUI = new StartUpUI();
        this.loop = null;
        this.assets = new AssetManager(assetList);

        this.audio = new SoundPlayer(assetList, this.AR.camera);

        this.currentLevel = 0;
        this.level = null;
        this.lastLevel = null;

    }

    findAsset(name) {
        return this.assets.assets.find((o) => o.name === name);
    }

    findModel (name) {
        return this.assets.models.find((o) => o.name === name);
    }

    startGame () {

        this.loop = new GameLoop(this.AR);

        this.setLevel(0);

    }

    nextLevel () {

        this.setLevel(this.currentLevel + 1);
        
    }

    setLevel (level) {
        if(this.levels[level]) {
            this.currentLevel = level;


            const firebutton = document.getElementById("firebutton");
            
            firebutton.src = `textures/${this.levels[level].WEAPON}.png`;


            document.getElementById("UI").classList.remove("hide");
            document.getElementById("UI").classList.add("show");


            const text = this.findModel(this.levels[level].ENEMY);
            const enemy = this.findAsset(this.levels[level].ENEMY);
            const weapon = this.findAsset(this.levels[level].WEAPON);
            if (this.level) { this.lastLevel = this.level };
            this.level = new this.levels[level].LEVEL(enemy, weapon, text, this.levels[level]);

            kickout(EVENTS.START_LEVEL, this.level);

            this.AR.markerRoot.add(this.level.root);
        } else {
            this.currentLevel = 0;
            this.setLevel(0);
        }
    }

    endLevel ( level ) {
        document.getElementById("UI").classList.remove("show");
        document.getElementById("UI").classList.add("hide");
    }


}


class AssetManager {

    constructor (assetList) {

        this.assetList = assetList;
        this.models = null;
        this.assets = null;
        window.addEventListener(EVENTS.LOAD_ASSETS, this.load.bind(this));

    }

    load() {
        this.loadModels().then((models)=>{
            this.models = models;
        }).then(()=>{
            this.loadAssets(this.assetList).then((meshes)=>{
                this.assets = meshes;
                kickout(EVENTS.ASSETS_READY);
            })
        })

    }

    loadModels (model = './models/Lion.glb') {
        return new Promise((resolve, reject)=>{

            new THREE.GLTFLoader().load(model, (gltf)=>{
    
                gltf.scene.traverse((c)=>{
                    if(c.material) {
                    let material = new THREE.MeshPhongMaterial({color: c.material.color, side: THREE.DoubleSide});
                    c.material = material;
                    }
                })
                
        
                resolve(gltf.scene.children);
        
            })
        })
        
        
    }

    loadAssets (assetList, path = "textures", extension = "png") {
        return new Promise((resolve, reject)=>{
            let loader = new THREE.TextureLoader();
            let textures = {};
            let meshes = [];
        
            assetList.map(t=>{
                textures[t] = loader.load(`${path}/${t}.${extension}`);
            })
        
            let geometry = new THREE.PlaneBufferGeometry(1,1, 4,4);
            let material = new THREE.MeshBasicMaterial({
                side: THREE.DoubleSide,
            });
            let mesh = new THREE.Mesh(geometry, material);
        
            Object.keys(textures).map((k,i)=>{
                const newMesh = mesh.clone();
                    newMesh.geometry = mesh.geometry.clone();
                    newMesh.material = mesh.material.clone();
                    newMesh.material.map = textures[k];
                    newMesh.material.alphaTest = 0.5;
                    newMesh.material.needsUpdate = true;
                    newMesh.name = k;
                    meshes.push(newMesh)
            });
    
           resolve(meshes);
        })
    }
    


    
    setButton (level) {
        let newMesh = levels[level].WEAPON;
        firebutton.src = `textures/${emojiList[newMesh]}.png`;
    }
    
    setCurrentEnemy(level) {
        let enemy = levels[level].ENEMY;
        
        markerRoot1.remove(currentEnemy);
    
        currentEnemy = emojiMeshes[enemy].clone();
            currentEnemy.geometry = currentEnemy
        
        markerRoot1.add(currentEnemy);
    }

}

const GRAVITY = new THREE.Vector3(0,-0.01,0);

class Bullet {
	constructor(mesh, direction, life = 10, scene, controller) {
		this.totalLife = life;
		this.life = life;
        this.dead = false;
        this.level = controller.level.details.ENEMY;
		this.mesh = mesh.clone();
		this.velocity = direction;
		this.rng = (0.5 - Math.random()) * 0.2;
		this.scene = scene;
		this.scene.add(this.mesh);
		controller.bullets.push(this);
	}

	update() {
		if(!this.dead) {
		if (this.life < 0 || this.mesh.position.z < 0) {
			this.dead = true;
			this.scene.remove(this.mesh);
            kickout(EVENTS.ENEMY_HIT, this.level);
            kickout(EVENTS.PLAY_SOUND, this.mesh.name);
		} else {
			this.velocity.add(GRAVITY);

			if(this.mesh.position.y < 0.5) {
				this.mesh.position.y = 0.5;
				this.velocity.y *= -0.5;
			}
			let prog = this.life / this.totalLife;
			this.mesh.scale.set(prog, prog, prog);
			this.mesh.position.add(this.velocity);
			this.mesh.rotateZ(this.rng);

			this.life--;
		}
	}
	}
}

class BulletController {
    
    constructor (scene) {
        this.lastShot = 0;
        this.shotRate = 0.2;
        this.bullets = [];

        this.enable = false;

        this.scene = scene;

        this.bulletMesh = null;

        window.addEventListener("touchstart", (e)=>{
            e.preventDefault();
            this.touch = true;
        })
        window.addEventListener("touchend", (e)=>{
            e.preventDefault();
            this.touch = false;
        })

        window.addEventListener("mousedown", (e)=>{
            e.preventDefault();
            this.touch = true;
        })
        window.addEventListener("mouseup", (e)=>{
            e.preventDefault();
            this.touch = false;
        })

        window.addEventListener(EVENTS.START_LEVEL, (e)=>{
            this.enable = true;
            this.level = e.detail;
           this.scene = e.detail.root;
           this.setBulletMesh(e.detail.weaponMesh);
        })
        window.addEventListener(EVENTS.WIN_LEVEL, (e)=>{
            this.enable = false;
        })
    }

    setBulletMesh(mesh) {
        this.bulletMesh = mesh.clone();
        this.bulletMesh.position.copy(new THREE.Vector3(0,0,4));
    }

    update() {
        if(this.touch && this.enable) {
            this.shoot( this.scene );
        }
        this.bullets.map(b=>b.update());
    }

    shoot (scene) {
        let now = performance.now();
        if (now - this.lastShot > this.shotRate * 1000) {
            this.lastShot = now;
            new Bullet(
                this.bulletMesh,
                new THREE.Vector3(0,Math.random()*0.2,-0.2),
                25,
                this.scene,
                this
            );
        }
    }

}


class ProgressBar {

    constructor (level) {
        this.complete = false;
        this.inZone = false;
        this.over = false;
        this.level = level.ENEMY;
        this.shotSize = level.SHOT_SIZE;
        this.regenRate = level.REGEN_RATE;
        this.sweetSpotStart = level.SWEET_SPOT;
        this.sweetSpotRange = level.SWEET_SPOT_SIZE;
        this.lockIn = level.LOCK_IN_TIME;
        this.hits = 0;
        this.totalHits = level.HEALTH;
        this.progressTarget = 0;
        this.dampen = 0.2;

        this.start = null;

        this.geometry = this.generateGeometry(this.progressTarget);

        this.complete = false;

        var material = new THREE.MeshBasicMaterial( { color: 0x55ff55, side: THREE.DoubleSide } );
        this.mesh = new THREE.Mesh( this.geometry, material );
        this.mesh.rotateX(THREE.Math.degToRad(90));

        window.addEventListener(EVENTS.ENEMY_HIT, (e)=>{

            if(e.detail === this.level) {
                this.hits+= this.shotSize;
            }

        });

        this.notInRangeColor = new THREE.Color(0xFF55FF);
        this.inRangeColor = new THREE.Color(0x55FF55);

    }

    update () {
        if(!this.complete) {
        this.progressTarget += ((this.hits/this.totalHits) - this.progressTarget) * this.dampen;
        this.mesh.geometry = this.generateGeometry(this.progressTarget);
        if(this.hits > 0) {
        this.hits -= this.regenRate;
        }
        if(this.hits > this.totalHits) {
            this.hits = this.totalHits-this.regenRate;
        }

        this.inZone = false;
        this.over = false;

        if(this.hits > this.sweetSpotStart && this.hits < this.sweetSpotStart+this.sweetSpotRange) {
            this.inZone = true;
            this.mesh.material.color = this.inRangeColor;
            if(this.start == null) {
                this.start = performance.now();
            }
            if(performance.now()-this.start > this.lockIn) {
                this.complete = true;
                kickout(EVENTS.ENEMY_DEAD);
            }
        } else if( this.hits < this.sweetSpotStart + this.sweetSpotRange ) {
            this.over = true;
            this.start = null;
            this.mesh.material.color = this.notInRangeColor;
        } else {
            this.start = null;
        }

        this.mesh.material.needsUpdate = true;


        } else {
            this.done();
        }
    }

    done () {
        this.mesh.position.y -= 0.03;
    }

    generateGeometry(progress = 1, size = 0.5, startAngle = -90, resolution = 64) {
        const rads = THREE.Math.degToRad(startAngle);
        const circleSize = THREE.Math.degToRad(360);
        return new THREE.RingBufferGeometry( size, size-(size*0.25), resolution, 1, rads, (circleSize * progress) );
    }
      
}

class GameLoop {

    constructor (AR) {
        this.AR = AR;

        this.clock = new THREE.Clock();

        this.totalTime = 0;
        this.deltaTime = 0;

        this.hits = 0;
        
        this.controller = new BulletController();

        this.levels = [];

        this.animate = this.animate.bind(this)

        this.animate();

        window.addEventListener(EVENTS.START_LEVEL, (e)=>{
            this.levels.push(e.detail);
        })

    }

    update () {
        
        this.controller.update();

        this.levels = this.levels.filter(l=>!l.dead);

        this.levels.map(l=>l.update());

        if ( this.AR.arToolkitSource.ready !== false )
            this.AR.arToolkitContext.update( this.AR.arToolkitSource.domElement );
    }
    
    render () {
        this.AR.renderer.render( this.AR.scene, this.AR.camera );
    }
    
    
    animate () {
        requestAnimationFrame(this.animate);
        this.deltaTime = this.clock.getDelta();
        this.totalTime += this.deltaTime;
        this.update();
        this.render();
    }

}


const game = new GameManager(LEVELS);
