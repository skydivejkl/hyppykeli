import {connectLean} from "lean-redux";
import {withRouterProps} from "./utils";
import {compose} from "recompose";
import {getOr} from "lodash/fp";
import qs from "querystring";
import u from "updeep";
import axios from "axios";
import parseMetar from "metar";

const asLatLonPair = ({lat, lon}) => `${lat},${lon}`;

export const addWeatherData = compose(
    withRouterProps(router => {
        return {
            dzProps: qs.parse(router.location.search.slice(1)),
        };
    }),
    connectLean({
        scope: "weatherData",

        mapState(state, props) {
            const metars = getOr(
                [],
                [props.dzProps.icaocode, "metars"],
                state
            ).map(parseMetar);

            return {
                metars,
                ...state[props.dzProps.fmisid],
                ...state[asLatLonPair(props.dzProps)],
            };
        },

        fetchGusts() {
            if (this.props.dzProps.fmisid) {
                return axios(
                    `/api/observations/${this.props.dzProps.fmisid}/fi-1-1-windgust`
                ).then(res => {
                    this.setState(
                        u({
                            [this.props.dzProps.fmisid]: {
                                gusts: res.data,
                            },
                        })
                    );
                });
            }

            return Promise.resolve();
        },

        fetchWindAvg() {
            if (this.props.dzProps.fmisid) {
                return axios(
                    `/api/observations/${this.props.dzProps.fmisid}/fi-1-1-windspeedms`
                ).then(res => {
                    this.setState(
                        u({
                            [this.props.dzProps.fmisid]: {
                                windAvg: res.data,
                            },
                        })
                    );
                });
            }

            return Promise.resolve();
        },

        fetchGustForecasts() {
            if (this.props.dzProps.lat && this.props.dzProps.lon) {
                return axios(
                    `/api/forecasts/${asLatLonPair(this.props.dzProps)}/enn-s-1-1-windgust`
                ).then(res => {
                    this.setState(
                        u({
                            [asLatLonPair(this.props.dzProps)]: {
                                gustForecasts: res.data,
                            },
                        })
                    );
                });
            }

            return Promise.resolve();
        },

        fetchWindAvgForecasts() {
            if (this.props.dzProps.lat && this.props.dzProps.lon) {
                return axios(
                    `/api/forecasts/${asLatLonPair(this.props.dzProps)}/enn-s-1-1-windspeedms`
                ).then(res => {
                    this.setState(
                        u({
                            [asLatLonPair(this.props.dzProps)]: {
                                windAvgForecasts: res.data,
                            },
                        })
                    );
                });
            }

            return Promise.resolve();
        },

        fetchMetars() {
            if (this.props.dzProps.icaocode) {
                return axios(
                    `/api/metars/${this.props.dzProps.icaocode}`
                ).then(res => {
                    this.setState(
                        u({
                            [this.props.dzProps.icaocode]: {
                                metars: res.data,
                            },
                        })
                    );
                });
            }

            return Promise.resolve();
        },

        fetchAll() {
            this.fetchGusts().then(() => {
                this.fetchWindAvg();
                this.fetchGustForecasts();
                this.fetchWindAvgForecasts();
                this.fetchMetars();
            });
        },
    })
);
