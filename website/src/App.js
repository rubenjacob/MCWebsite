import React from 'react';
import './App.css';
import MapContainer from './Map.js'
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            places: [],
            transportationMode: "WALKING",
            warningOpen: false,
            calculated: false
        }
    }

    handleAdd = (place) => {
        if (this.state.places.length === 9) {
            this.setState(state => ({
                warningOpen: true
            }))
        } else {
            this.setState(state => ({
                places: state.places.concat([place])
            }));
        }
    }

    handleRemove = (key) => {
        const index = this.state.places.findIndex(x => x.id === key)
        if (index > -1) {
            //copy array and set array with removed element as new state
            const newState = this.state.places.slice();
            newState.splice(index, 1);
            this.setState(state => ({
                places: newState
            }));
        }
    }

    handleModeChange = (event, mode) => {
        this.setState(state => ({
            transportationMode: mode.props.value
        }));
    }

    handleWarningClose = () => {
        this.setState(state => ({
            warningOpen: false
        }))
    }

    componentDidMount = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                const place = { id: "0", name: "0", position: pos }
                this.handleAdd(place);
            });
        }
    }

    onCalculate = () => {
        const positionArray = this.state.places.map(place => place.position)
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
            {
                origins: positionArray,
                destinations: positionArray,
                travelMode: this.state.transportationMode
            }, (response, status) => {
                if (status === "OK") {
                    this.calculateRoundtrip(response);
                } else {
                    console.log(status);
                }
            }
        )
    }

    calculateRoundtrip = (response) => {
        //build adjacency matrix of travel durations from response
        const length = this.state.places.length;
        const places = [...this.state.places.keys()].slice(1)
        var adj = new Array(length);
        for (var i = 0; i < length; i++) {
            adj[i] = response.rows[i].elements.map(element => element.duration.value);
        }
        //naive O(n!) algorithm:
        //1. find all permutations of roundtrip paths
        //2. run through all of them to find the one with the lowest cost
        var permutations = this.permute(places);
        permutations.map(permutation => permutation.unshift(0));
        permutations.map(permutation => permutation.push(0));
        var minCost = Number.MAX_SAFE_INTEGER;
        var minIndex = 0;
        for (var i = 0; i < permutations.length; i++) {
            const cost = this.calculatePathCost(permutations[i], adj);
            if (cost < minCost) {
                minCost = cost;
                minIndex = i;
            }
        }

        var path = permutations[minIndex].map(i => this.state.places[i]);
        path.pop();
        this.setState(state => ({
            calculated: true,
            places: path
        }))
    }

    calculatePathCost = (path, adj) => {
        var result = 0;
        for (var i = 0; i < path.length - 1; i++) {
            var origin = path[i];
            var destination = path[i + 1];
            result += adj[origin][destination];
        }
        return result;
    }

    //https://stackoverflow.com/questions/9960908/permutations-in-javascript/37580979#37580979
    //calculates all permutations of an array
    permute = (permutation) => {
        var length = permutation.length,
            result = [permutation.slice()],
            c = new Array(length).fill(0),
            i = 1, k, p;

        while (i < length) {
            if (c[i] < i) {
                k = i % 2 && c[i];
                p = permutation[i];
                permutation[i] = permutation[k];
                permutation[k] = p;
                ++c[i];
                i = 1;
                result.push(permutation.slice());
            } else {
                c[i] = 0;
                ++i;
            }
        }
        return result;
    }

    onClear = () => {
        this.setState(state => ({
            places: [],
            calculated: false
        }))
    }

    render() {
        return (
            <div className="App">
                <h1>Shortest Roundtrip Calculator</h1>
                <h3>Click on the map to select up to nine places you want to go.</h3>

                <FormControl>
                    <InputLabel id="select-label">Mode of transportation</InputLabel>
                    <Select
                        labelId="select-label"
                        id="mode-select"
                        value={this.state.transportationMode}
                        onChange={this.handleModeChange}
                    >
                        <MenuItem value="WALKING">Walking</MenuItem>
                        <MenuItem value="BICYCLING">Bicycling</MenuItem>
                        <MenuItem value="TRANSIT">Public Transit</MenuItem>
                        <MenuItem value="DRIVING">Driving</MenuItem>
                    </Select>
                </FormControl>

                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={this.onCalculate}
                    disabled={this.state.calculated}>
                    Calculate
                </Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={this.onClear}
                    disabled={!this.state.calculated}>
                    Clear
                </Button>

                <MapContainer
                    handleAdd={this.handleAdd}
                    handleRemove={this.handleRemove}
                    places={this.state.places}
                    calculated={this.state.calculated}
                />

                <Dialog
                    open={this.state.warningOpen}
                    onClose={this.handleWarningClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Maximum number of places exceeded"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Due to limitations of the free version of the Google Maps API the maximum number of places available is nine.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleWarningClose} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}
