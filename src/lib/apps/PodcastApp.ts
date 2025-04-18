import { FakeOS } from '../../scenes/FakeOS';
import App from '../../lib/apps/App';
import TrackPreview from '../ui/gameObjects/tracks/TrackPreview';
import TrackProgressBar from '../ui/gameObjects/tracks/TrackProgressBar';
import TrackButtons from '../ui/gameObjects/tracks/TrackButtons';
import { PhoneEvents } from '../events/GameEvents';


/**
 * Podcast app.
 */
 export default class PodcastApp extends App {

    protected tracks: any;
    protected textOptions: any = {
            fontSize: "24px",
            align: "left",
            color: '#efefef',
            fontFamily: 'Roboto-Bold',
            wordWrap: { width: this.fakeOS.width - 50, useAdvancedWrap: true }
    };
    protected currentTrack: any;

    /**
     * Class constructor.
     *
     * @param fakeOS
     */
    public constructor(fakeOS: FakeOS) {
        super(fakeOS, {rows: 6});
        this.tracks = this.fakeOS.cache.json.get('podcast');
    }

    /**
     * @inheritdoc
     */
    public render() {
        this.getActiveLayer().clear();
        this.setBackground();
        this.currentTrack = undefined;
        for (let i=0; i < this.tracks.length; i++) {
            this.fakeOS.sound.add(this.tracks[i].key, this.tracks[i]);
            let preview = new TrackPreview(this.fakeOS, 0, 0, this.tracks[i], this.textOptions);
            this.addRow(preview);

            this.fakeOS.addInputEvent(
                'pointerup',
                () => {
                    this.addLayer();
                    this.openTrack(this.tracks[i])
                },
                preview
            );
        }

        this.addListeners();
    }

    /**
     * @inheritdoc
     */
    public update(delta: any, time: any): void {
        super.update(delta, time);
        if (this.currentTrack !== undefined) {
            let current_track = this.fakeOS.sound.get(this.currentTrack.key);
            if (current_track instanceof Phaser.Sound.WebAudioSound) {
                let seek = Math.floor(current_track.seek.valueOf());
                let duration = current_track.duration;

                this.currentTrack.progressBar.update_cursor(seek/duration);
                this.currentTrack.seek_time.setText(
                    Math.floor(seek / 60) + ':' + (seek % 60 < 10 ? '0': '') + Math.floor(seek % 60)
                );
            }

        }
    }

    /**
     * Shows an specific track.
     * @param track
     */
    public openTrack(track: any): void {

        let pic = this.fakeOS.add.image(
            this.area.width * 0.5,
            this.area.height * 0.3,
            track.key
        );

        let trackName = this.fakeOS.add.text(
            this.area.width * 0.5,
            this.area.height * 0.6,
            track.name,
            this.textOptions
        ).setOrigin(0.5);

        let artist = this.fakeOS.add.text(
            this.area.width * 0.5,
            this.area.height * 0.6 + 34,
            track.artist,
            this.textOptions
        ).setOrigin(0.5);

        let progressBar = new TrackProgressBar(this.fakeOS,
            this.area.width * 0.5,
            this.area.height * 0.7,
            track
        );
        let duration = this.fakeOS.sound.get(track.key).duration;
        let seek_time = this.fakeOS.add.text(
            this.area.width * 0.5 - (progressBar.width * 0.5),
            this.area.height * 0.7 + progressBar.height,
            '0:00',
            this.textOptions
        );
        let total_time = this.fakeOS.add.text(
            this.area.width * 0.5 + (progressBar.width * 0.5),
            this.area.height * 0.7 + progressBar.height,
            Math.floor(duration / 60) + ':' + Math.round(duration % 60),
            this.textOptions
        ).setOrigin(1, 0);
        let buttons = new TrackButtons(this.fakeOS,
            this.area.width * 0.5,
            this.area.height * 0.8,
            track,
            this.textOptions
        );

        this.currentTrack = {key: track.key, progressBar: progressBar, seek_time: seek_time}

        this.getActiveLayer().add([pic, trackName, artist, progressBar, buttons, seek_time, total_time]);
    }

    /**
     * Adds listeners to player buttons.
     */
    public addListeners(): void {

        // Play/pause button event
        this.fakeOS.addEventListener(
            PhoneEvents.TrackPlaying,
            (track: any) => {
                let audio = this.fakeOS.sound.get(track.key);
                if (audio.isPlaying) {
                    audio.pause();
                } else if (audio.isPaused) {
                    audio.resume();
                } else {
                    this.fakeOS.sound.stopAll();
                    audio.play();
                }
            }
        );

        // Stop button event
        this.fakeOS.addEventListener(
            PhoneEvents.TrackStopped,
            (track: any) => {
                this.fakeOS.sound.stopAll();
            }
        );

        // Previous button
        this.fakeOS.addEventListener(
            PhoneEvents.TrackPrevious,
            (track: any) => {
                let index = this.tracks.findIndex((x:any) => x.key == track.key);
                let nextTrackIndex = this.mod(index - 1, this.tracks.length);

                this.clearCurrentLayer();
                this.openTrack(this.tracks[nextTrackIndex]);

                if (this.fakeOS.sound.get(track.key).isPlaying) {
                    this.fakeOS.sound.stopAll();
                    this.fakeOS.sound.get(this.tracks[nextTrackIndex].key).play();
                }
            }
        );

        // Next button
        this.fakeOS.addEventListener(
            PhoneEvents.TrackNext,
            (track: any) => {
                let index = this.tracks.findIndex((x:any) => x.key == track.key);
                let nextTrackIndex = this.mod(index + 1, this.tracks.length);

                this.clearCurrentLayer();
                this.openTrack(this.tracks[nextTrackIndex]);

                if (this.fakeOS.sound.get(track.key).isPlaying) {
                    this.fakeOS.sound.stopAll();
                    this.fakeOS.sound.get(this.tracks[nextTrackIndex].key).play();
                }
            }
        );

        // Click on / move progress bar
        this.fakeOS.addEventListener(
            PhoneEvents.TrackPlayAt,
            (track: any, pointer: any) => {
                let audio = this.fakeOS.sound.get(track.key);
                this.fakeOS.sound.stopAll();
                audio.play({seek: Math.floor(pointer*audio.duration)});
            }
        );
    }

    /**
     * Auxiliary modulo function.
     * @param n
     * @param m
     * @returns
     */
    protected mod(n: number, m: number): number {
        return ((n % m) + m) % m;
    }

     /**
     * Set app background
     */
    protected setBackground(image?: string): void {
        if (image !== undefined) {
            this.fakeOS.UI.setBackground(image);
        } else {
            let background = this.fakeOS.cache.json.get('apps').find(app => app.key == 'PodcastApp').background;
            console.log(background);
            this.fakeOS.UI.setBackground(background);
        }
    }
}
