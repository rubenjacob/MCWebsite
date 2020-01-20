import React from 'react'
import { Map, GoogleApiWrapper, Marker, Polyline } from 'google-maps-react'
import './Map.css'

var counter = 1;
const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

export class MapContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            initialCenter: props.places.length > 0 ? props.places[0].position : { lat: 49.01386, lng: 8.41965 },
            calculated: props.calculated,
            polyline: []
        }
    }

    // componentDidUpdate(prevProps) {
    //     if (this.props.calculated) {
    //         var polyline = this.props.places.map(x => x.position);
    //         polyline.push(polyline[0]);
    //         this.setState(state => ({
    //             polyline: polyline
    //         }))
    //     }
    // }

    onMapClicked = (props, map, event) => {
        var place = {
            id: counter.toString(),
            name: counter.toString(),
            position: event.latLng
        }
        counter++;
        this.props.handleAdd(place);
    }

    onRemove = (props, marker) => {
        this.props.handleRemove(marker.name);
    }

    render() {
        return (
            <Map
                google={this.props.google}
                zoom={15}
                containerStyle={style}
                clickableIcons={true}
                initialCenter={this.state.initialCenter}
                onClick={this.onMapClicked}
            >
                {this.props.places.map((place, index) => (
                    <Marker
                        key={place.id}
                        name={place.name}
                        position={place.position}
                        onClick={this.onRemove}
                        label={labels[index % labels.length]}
                    />
                ))}
                <Polyline
                    fillColor="#0000FF"
                    fillOpacity={0.35}
                    path={this.props.calculated ? this.props.places.map(x => x.position) : []}
                    strokeColor="#0000FF"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                />
            </Map>
        );
    }
}

const style = {
    width: '100%',
    height: '67%',
    position: 'absolute'
}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyB56Buw0gtaZzwgFsErJDlZPSxrKvdihCs'
})(MapContainer);