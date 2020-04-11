import React, { Component } from "react";
import THREE from "three";
import { Points } from "./viz/Points.js";

export class StarsBackground extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.enabled = true;
    this.visualizer = new Points();
    this.rootDiv.appendChild(this.visualizer.domElement);
    this.onWindowResize = () => {
      this.visualizer.onWindowResize();
    };
    window.addEventListener("resize", this.onWindowResize);
    this.visualizer.enable();
    this.animate();
  }

  componentWillUnmount() {
    this.visualizer.disable();
    this.enabled = false;
    window.removeEventListener("resize", this.onWindowResize);
  }

  animate() {
    if (this.enabled) {
      window.requestAnimationFrame(this.animate.bind(this));
      this.visualizer.render();
    }
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
