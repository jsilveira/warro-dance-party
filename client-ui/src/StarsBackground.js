import React, {Component} from "react";
import _ from 'lodash'

const stars = _.map(_.range(0, 100), (i) => {
  let randomPositionStyle = {
    opacity: `${Math.random()**3}`,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`
  };

  return <div className={"star"} key={i} style={randomPositionStyle}/>;
});

export default function() {
  return <div className={'stars-container'}>{stars}</div>
};