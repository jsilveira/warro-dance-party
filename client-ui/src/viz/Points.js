import * as THREE from "three";

import {Visualizer} from "./Visualizer.js";

function generatePointCloudGeometry(color, width, length) {
  var geometry = new THREE.BufferGeometry();
  var numPoints = width * length;

  var positions = new Float32Array(numPoints * 3);
  var colors = new Float32Array(numPoints * 4);

  var k = 0;

  for (var i = 0; i < width; i++) {

    for (var j = 0; j < length; j++) {

      var u = i / width;
      var v = j / length;
      var x = u - 0.5;
      var y = (Math.cos(u * Math.PI * 4) + Math.sin(v * Math.PI * 8)) / 20;
      var z = v - 0.5;

      positions[3 * k] = x;
      positions[3 * k + 1] = y;
      positions[3 * k + 2] = z;

      var intensity = (y + 0.1) * 3;
      colors[3 * k] = color.r * intensity;
      colors[3 * k + 1] = color.g * intensity;
      colors[3 * k + 2] = color.b * intensity;

      k++;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingBox();

  return geometry;
}

export class Points extends Visualizer {
  constructor() {
    super();
    const scene = this.scene = new THREE.Scene();
    const clock = this.clock = new THREE.Clock();

    const camera = this.camera = new THREE.PerspectiveCamera(
        45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(10, 10, 10);
    camera.lookAt(scene.position);
    camera.updateMatrix();

    var geometry =
        generatePointCloudGeometry(new THREE.Color(1, .5, .1), 70, 70);
    var material = new THREE.PointsMaterial({size : .1, vertexColors : true});
    var points = new THREE.Points(geometry, material);
    points.scale.set(50, 25, 50);
    scene.add(points);

    camera.position.z = 5;

    const renderer = this.renderer =
        new THREE.WebGLRenderer({antialias : true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.domElement = renderer.domElement;

    window.addEventListener("resize", this.onWindowResize.bind(this), false);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.scene.rotation.y = 0.2 * this.clock.getElapsedTime();
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }
}
