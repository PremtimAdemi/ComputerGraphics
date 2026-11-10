import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/Addons.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xcccccc)

const aspect = window.innerWidth / window.innerHeight

const perspective = new THREE.PerspectiveCamera(75, aspect, 0.1, 100)
perspective.position.set(2, 2, 10)
perspective.lookAt(0, 0, 0)

const size = 8
const orthographic = new THREE.OrthographicCamera(
    -size * aspect,
    size * aspect,
    size,
    -size,
    0.1,
    100
)
orthographic.position.set(0, 0, 10)
orthographic.lookAt(0, 0, 0)

const cameras = [perspective, orthographic]
let current = 0
console.log('Active:', cameras[current].type)

window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return

    event.preventDefault()
    if (event.repeat) return

    current = (current + 1) % cameras.length
    console.log('Active:', cameras[current].type)
})

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const ambient = new THREE.AmbientLight(0xffffff, 0.4)
const directional = new THREE.DirectionalLight(0xffffff, 3.5)
directional.position.set(5, 8, 4)
scene.add(ambient, directional)

const depths = [0, -3, -8]
const colors = [0xa65c4c, 0xed9494, 0x404f82]

new PLYLoader().load(
    './Models/3dModel.ply',
    (geometry) => {
        geometry.center()
        geometry.computeVertexNormals()

        for (let i = 0; i < depths.length; i++) {
            const material = new THREE.MeshStandardMaterial({
                color: colors[i],
                roughness: 0.4
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.setScalar(0.02)
            mesh.rotation.x = Math.PI
            mesh.position.set((i - 1) * 2, 0, depths[i])
            scene.add(mesh)
        }
    },
    undefined,
    (error) => console.error('Could not load 3dModel.ply:', error)
)

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, cameras[current])
}

animate()