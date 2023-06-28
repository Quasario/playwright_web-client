import {currentURL, videoFolder, hostName} from '../global_variables';
import { green, blue, yellow, red } from 'colors';

export async function getArchiveIntervals(archiveName: string, camera: { [key: string]: any, 'accessPointChanged': string }, endTime: string, startTime: string) {
    let request = await fetch(`${currentURL}/archive/contents/intervals/${camera.accessPointChanged}/${endTime}/${startTime}?archive=hosts/${hostName}/MultimediaStorage.${archiveName}/MultimediaStorage&limit=1024&offset=0&scale=1`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let intervalsList = await request.json();

    if (request.ok) {
        console.log(intervalsList.intervals);
        return intervalsList.intervals;
        
    } else console.log(`Error: could not pull cameras list. Code: ${request.status}`.red);
};

export async function transformISOtime(intervals: { begin: string, end: string }[]) {
    let trasformedArray = Array();
    const currentTime = new Date();
    const timeOffset = currentTime.getTimezoneOffset() / 60;
    for (let interval of intervals) {
        let beginHoursWithOffset = Number(interval.begin.slice(9, 11)) - timeOffset;
        let beginDay = Number(interval.begin.slice(6, 8))
        if (beginHoursWithOffset >= 24) {
            beginHoursWithOffset = beginHoursWithOffset - 24;
            beginDay++
        }
        if (beginHoursWithOffset < 0) {
            beginHoursWithOffset = beginHoursWithOffset + 24;
            beginDay--
        }

        let endHoursWithOffset = Number(interval.end.slice(9, 11)) - timeOffset;
        let endDay = Number(interval.end.slice(6, 8))
        if (endHoursWithOffset >= 24) {
            endHoursWithOffset = endHoursWithOffset - 24;
            endDay++
        }
        if (endHoursWithOffset < 0) {
            endHoursWithOffset = endHoursWithOffset + 24;
            endDay--
        }

        trasformedArray.push(
            { //"20230628T075236.756000"
                begin: {
                    year: Number(interval.begin.slice(0, 4)),
                    month: Number(interval.begin.slice(4, 6)),
                    day: beginDay,
                    hours: beginHoursWithOffset,
                    minutes: Number(interval.begin.slice(11, 13)),
                    seconds: Number(interval.begin.slice(13, 15)),
                    milliseconds: Number(interval.begin.slice(16, 19)),
                },
                end: {
                    year: Number(interval.end.slice(0, 4)),
                    month: Number(interval.end.slice(4, 6)),
                    day: endDay,
                    hours: endHoursWithOffset,
                    minutes: Number(interval.end.slice(11, 13)),
                    seconds: Number(interval.end.slice(13, 15)),
                    milliseconds: Number(interval.end.slice(16, 19)),
                }
            }
        )
    }
    console.log(trasformedArray[0]);
    console.log(trasformedArray[0].begin);
    console.log(trasformedArray[0].end);
}