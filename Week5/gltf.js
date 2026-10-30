import * as THREE from 'three'
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xcccccc)

const camera = new THREE.PerspectiveCamera(
    55,
    innerWidth / innerHeight,
    0.1,
    100
)
camera.position.set(3, 2, 5)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
document.body.appendChild(renderer.domElement)

scene.add(new THREE.AmbientLight(0xffffff, 0.4))

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(5, 8, 4)
scene.add(directionalLight)

const control = new OrbitControls(camera, renderer.domElement)

const loader = new GLTFLoader()

loader.load(
    './public/model.glb',
    (gltf) => {
        const model = gltf.scene
        model.rotation.y = Math.PI

        // Resize the model
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const longestSide = Math.max(size.x, size.y, size.z)

        if (longestSide > 0) {
            model.scale.setScalar(3 / longestSide)
        }

        // Center the model
        box.setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)

        scene.add(model)

        let meshCount = 0
        let totalVertices = 0
        let totalFaces = 0

        model.traverse((child) => {
            if (child.isMesh) {
                meshCount++

                const geometry = child.geometry
                const position = geometry.getAttribute('position')
                const index = geometry.index

                const vertices = position.count
                const faces = index ? index.count / 3 : vertices / 3

                totalVertices += vertices
                totalFaces += faces

                console.log('Mesh', child.name)
                console.log('Vertices', vertices)
                console.log('Faces', faces)
            }
        })

        console.log('Total Meshes', meshCount)
        console.log('Total Vertices', totalVertices)
        console.log('Total Faces', totalFaces)
    },
    undefined,
    (error) => {
        console.error('Could not load model.glb:', error)
    }
)

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
})

function animate() {
    requestAnimationFrame(animate)
    control.update()
    renderer.render(scene, camera)
}

animate()