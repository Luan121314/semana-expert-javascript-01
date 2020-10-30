class VideoMediaPlayer{
    constructor({manifestJSON, network}){
        this.manifestJSON = manifestJSON
        this.network = network
        this.videoElement = null;
        this.sourceBuffer = null;
        this.selected = {}
        this.videoDuration = 0;
    }

    initializeCodec(){
        this.videoElement = document.getElementById("vid");
        const mediaSourceSupported = !!window.MediaSource
        if(!mediaSourceSupported){
            alert('Seu browser ou sistema não tem suport a MSE !');
            return
        }

        const codecSupport = MediaSource.isTypeSupported(this.manifestJSON.codec)
        if(!codecSupport){
            alert(`Seu browser não suporta o codec: ${this,this.manifestJSON.codec}`);
            return
        }


        const mediaSource = new MediaSource();
        this.videoElement.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener("sourceopen", this.sourceOpenWrapper(mediaSource))
    }

    sourceOpenWrapper(mediaSource){
        return async(_) =>{
            this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
            const select  = this.selected = this.manifestJSON.intro;

            mediaSource.duration = this.videoDuration;
            await this.fileDownload(select.url)
        }

    }

    async fileDownload(url){
        const prepareUrl = {
            url,
            fileResolution: 360,
            fileResolutionTag: this.manifestJSON.fileResolutionTag,
            hostTag: this.manifestJSON.hostTag
        }
        const finalURL = this.network.parseManifestURL(prepareUrl);
        this.setVideoPlayerDuration(finalURL)
        const data = await this.network.fetchFile(finalURL);
        return this.processBufferSegments(data)
    }

    setVideoPlayerDuration(finalURL){
        const bars = finalURL.split('/');
        const [name, videoDuration] = bars[bars.length - 1].split('-');
        this.videoDuration += parseFloat(videoDuration)

    }

    

    async processBufferSegments(allSegments){
        const sourceBuffer = this.sourceBuffer;
        sourceBuffer.appendBuffer(allSegments)

        return new Promise((resolve, reject)=>{
            const updateEnd = (_)=>{
                sourceBuffer.removeEventListener("updateend", updateEnd)
                sourceBuffer.timestampOffset = this.videoDuration;

                return resolve()
            }

            sourceBuffer.addEventListener("updateend", updateEnd)
            sourceBuffer.addEventListener("error", reject)
        })
    }
}