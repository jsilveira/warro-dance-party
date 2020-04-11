import React, { Component } from "react";
import THREE from "three";
import { Points } from "./viz/Points.js";

export class StarsBackground extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.visualizer = new Points();
    this.rootDiv.appendChild(this.visualizer.domElement);
    this.animate();
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
    this.visualizer.render();
  }

  render() {
    return (
      <div
        className={"stars-container"}
        ref={element => (this.rootDiv = element)}
      />
    );
  }
}
