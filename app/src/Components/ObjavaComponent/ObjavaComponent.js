import React, { Component } from 'react';
import './ObjavaComponent.css';

export class Objava extends React.Component {
  render() {
    return (
        <div className='objava'>
          <div className="objava-content">
            <div className='author'>{this.props.avtor}</div>
            <div className='vsebina'>{this.props.vsebina}</div>
            <div className='author'>{this.props.timestamp}</div>
          </div>
        </div>
    )
  }
}