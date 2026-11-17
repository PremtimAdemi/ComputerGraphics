import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'

// Scene, camera, and renderer
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xcccccc)

const camera = new THREE.PerspectiveCamera(
    60,
    innerWidth / innerHeight,
    0.1,
    100
)
camera.position.set(0, 7, 12)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

scene.add(new THREE.AmbientLight(0xffffff, 0.5))

const light = new THREE.DirectionalLight(0xffffff, 2.5)
light.position.set(4, 6, 5)
scene.add(light)

// Floor and pickable objects
const gridSize = 20
const gridHalf = gridSize / 2
scene.add(new THREE.GridHelper(gridSize, gridSize))

const pickables = []
const colors = [0xff5733, 0x2ecc71, 0x3498db, 0x9b59b6]

const geometries = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.ConeGeometry(0.6, 1.5, 32),
    new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32),
    new THREE.TorusGeometry(0.6, 0.2, 16, 48)
]

for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i]
    geometry.computeBoundingBox()

    const material = new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.5
    })

    const mesh = new THREE.Mesh(geometry, material)

    // Place the bottom of each shape on the floor
    const floorHeight = -geometry.boundingBox.min.y
    mesh.position.set(-4.5 + i * 3, floorHeight, 0)

    scene.add(mesh)
    pickables.push(mesh)
}

// Save the original position and scale of every object
const initialPositions = pickables.map(object => object.position.clone())
const initialScales = pickables.map(object => object.scale.clone())

// Convert pointer coordinates to normalized device coordinates
const pointer = new THREE.Vector2()

function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect()

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    return pointer
}

// Selection and dragging
const raycaster = new THREE.Raycaster()
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const intersection = new THREE.Vector3()
const dragOffset = new THREE.Vector3()
const bounds = new THREE.Box3()
const objectSize = new THREE.Vector3()

let selected = null
let dragging = false
let activePointerId = null

renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || dragging) return

    raycaster.setFromCamera(updatePointer(event), camera)
    const hits = raycaster.intersectObjects(pickables, false)

    // Remove the previous highlight
    if (selected) {
        selected.material.emissive.setHex(0x000000)
    }

    selected = hits.length > 0 ? hits[0].object : null

    if (!selected) return

    selected.material.emissive.setHex(0x552200)

    if (!raycaster.ray.intersectPlane(floorPlane, intersection)) return

    // Keep the object from jumping to the pointer when dragging starts
    dragOffset.copy(selected.position).sub(intersection)

    dragging = true
    activePointerId = event.pointerId
    controls.enabled = false

    renderer.domElement.setPointerCapture(event.pointerId)
})

renderer.domElement.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== activePointerId) return

    raycaster.setFromCamera(updatePointer(event), camera)

    if (!raycaster.ray.intersectPlane(floorPlane, intersection)) return

    // Use the object's full size to keep it inside the grid
    bounds.setFromObject(selected)
    bounds.getSize(objectSize)

    const halfWidth = objectSize.x / 2
    const halfDepth = objectSize.z / 2

    selected.position.x = THREE.MathUtils.clamp(
        intersection.x + dragOffset.x,
        -gridHalf + halfWidth,
        gridHalf - halfWidth
    )

    selected.position.z = THREE.MathUtils.clamp(
        intersection.z + dragOffset.z,
        -gridHalf + halfDepth,
        gridHalf - halfDepth
    )
})

function stopDragging(event) {
    if (event.pointerId !== activePointerId) return

    dragging = false
    activePointerId = null
    controls.enabled = true

    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId)
    }
}

renderer.domElement.addEventListener('pointerup', stopDragging)
renderer.domElement.addEventListener('pointercancel', stopDragging)
renderer.domElement.addEventListener('lostpointercapture', stopDragging)

// GUI button restores both position and scale
const gui = new GUI()

const actions = {
    reset() {
        for (let i = 0; i < pickables.length; i++) {
            pickables[i].position.copy(initialPositions[i])
            pickables[i].scale.copy(initialScales[i])
            pickables[i].material.emissive.setHex(0x000000)
        }

        selected = null
    }
}

gui.add(actions, 'reset').name('Reset positions and scales')

// Update the view when the window size changes
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
})

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

animate()