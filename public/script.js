const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )

  recognizeFaces()
}

async function recognizeFaces() {
  
  
  video.addEventListener('play', async () => {

    const labeledDescriptors = (await loadLabeledImages()).filter(item => item._descriptors.length !== 0)
    console.log('labeledDescriptors:', labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)
    
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
  
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  
      const results = resizedDetections.map((d) => {
        return faceMatcher.findBestMatch(d.descriptor)
      })
      results.forEach( (result, i) => {
          const box = resizedDetections[i].detection.box
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
          drawBox.draw(canvas)
      })
    }, 100)
  })
}


// video.addEventListener('play', async () => {

//   const labeledDescriptors = await loadLabeledImages()
//   console.log(labeledDescriptors)
//   const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)

//   const canvas = faceapi.createCanvasFromMedia(video)
//   document.body.append(canvas)
//   const displaySize = { width: video.width, height: video.height }
//   faceapi.matchDimensions(canvas, displaySize)
//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks()
//       .withFaceDescriptors()

//     const resizedDetections = faceapi.resizeResults(detections, displaySize)
//     canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

//     const results = resizedDetections.map((d) => {
//       return faceMatcher.findBestMatch(d.descriptor)
//     })
//     results.forEach( (result, i) => {
//         const box = resizedDetections[i].detection.box
//         const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
//         drawBox.draw(canvas)
//     })
//   }, 100)
// })

const loadLabeledImages = async () => {
  const responce = await fetch('/labeled_images/persons.json')
  const data = await responce.json()
  const labels = data.names

  return Promise.all(
    labels.map(async (label)=>{
        const descriptions = []

        let count = 1
        while (true) {
          let img
          try {
            img = await faceapi.fetchImage(`../labeled_images/${label}/${count}.jpg`)
          } catch(e) {
            break
          }
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          descriptions.push(detections.descriptor)
          count++
        }
        
        return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}