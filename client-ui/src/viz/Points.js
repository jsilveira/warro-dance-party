import * as THREE from "three";

import {Visualizer} from "./Visualizer.js";

export class Points extends Visualizer {
  constructor() {
    super();
    this.intensity = .1;
    this.gridWidth = 50;
    this.gridLength = 50;
    this.baseColor = new THREE.Color(1, .5, .1);
    const scene = this.scene = new THREE.Scene();
    const clock = this.clock = new THREE.Clock();

    const camera = this.camera = new THREE.PerspectiveCamera(
        45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(10, 10, 10);
    camera.lookAt(scene.position);
    camera.updateMatrix();

    this.generatePointCloudGeometry();
    var geometry = this.geometry;
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
  }

  generatePointCloudGeometry() {
    var geometry = new THREE.BufferGeometry();
    var numPoints = this.gridWidth * this.gridLength;

    this.positions = new Float32Array(numPoints * 3);
    this.colors = new Float32Array(numPoints * 3);
    geometry.setAttribute('position',
                          new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry = geometry;
    this.updatePositionsAndColors();
  }

  updatePositionsAndColors() {
    var baseColor = this.baseColor;
    var positions = this.positions;
    var colors = this.colors;
    var k = 0;

    for (var i = 0; i < this.gridWidth; i++) {

      for (var j = 0; j < this.gridLength; j++) {

        var u = i / this.gridWidth;
        var v = j / this.gridLength;
        var x = u - 0.5;
        var y = (Math.cos(u * Math.PI * 4) + Math.sin(v * Math.PI * 8)) / 20;
        var z = v - 0.5;

        positions[3 * k] = x;
        positions[3 * k + 1] = y;
        positions[3 * k + 2] = z;

        var intensity = (.1 + .2 * y + .3 * this.intensity) * 3;
        colors[3 * k] = baseColor.r * intensity;
        colors[3 * k + 1] = baseColor.g * intensity;
        colors[3 * k + 2] = baseColor.b * intensity;

        k++;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeBoundingBox();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.scene.rotation.y = 0.02 * this.clock.getElapsedTime();
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  onAudioData(samples, fft) {
    super.onAudioData(samples, fft);
    let max = 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const sample = (samples[i]/128) - 1;
      const absSample = Math.abs(sample);
      if (absSample > max) {
        max = absSample;
      }
      sum += absSample;
    }
    const avg = sum / samples.length;
    if (!this.max || max > this.max) {
      this.max = max;
    } else {
      this.max = 0.7 * this.max + 0.3 * max;
    }
    if (!this.slowMax || max > this.slowMax) {
      this.slowMax = max;
    } else {
      this.slowMax = 0.9 * this.slowMax + 0.1 * max;
    }
    if (!this.avg) {
      this.avg = avg;
    } else {
      this.avg = 0.7 * this.avg + 0.3 * avg;
    }
    let norm = this.slowMax - this.avg;
    let normalizedPower = norm? (this.max - this.avg) / norm : 0;
    this.intensity = Math.pow(normalizedPower, 2);
    this.updatePositionsAndColors();
  }
}
