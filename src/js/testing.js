let modelNum = 1;

web3.eth.getBlockNumber((n,b) => {
    modelNum = b;
})

export const testing = {

    getRandomInt: function(max=1, min = 0) {
        return Math.floor(Math.random() * (max-min+1) + min);
    },

    setModelNum: function(num) {
        modelNum = num;
    },

    createModel: function (layers, callback = (_model) => {}) {

        window.localStorage.clear()

        if(layers.length < 2) return false;

        let numInputs = layers[0];
        let numOutputs = layers[layers.length - 1];
        let numLayers = layers.length - 2;


        let input1 = new Array(numInputs).fill(0).map(e => this.getRandomInt(5,1));
        let input2 = new Array(numInputs).fill(0).map(e => this.getRandomInt(5,1));
        let input3 = new Array(numInputs).fill(0).map(e => this.getRandomInt(5,1));
        let input4 = new Array(numInputs).fill(0).map(e => this.getRandomInt(5,1));

        let output1 = new Array(numOutputs).fill(0).map(e => this.getRandomInt(5,1));
        let output2= new Array(numOutputs).fill(0).map(e => this.getRandomInt(5,1));
        let output3 = new Array(numOutputs).fill(0).map(e => this.getRandomInt(5,1));
        let output4 = new Array(numOutputs).fill(0).map(e => this.getRandomInt(5,1));

        const input = [input1, input2, input3, input4];
        const inputTensor = tf.tensor(input, [input.length, input[0].length]);

        const output = [output1, output2, output3, output4];
        const outputTensor = tf.tensor(output, [output.length, output[0].length]);

        let model = tf.sequential();
        model.add(
            tf.layers.dense({ inputShape: [input[0].length], units: input[0].length, activation: 'sigmoid' })
        );

        for(let i = 1; i < numLayers - 1; i++){
            model.add(
                tf.layers.dense({units: layers[i], activation: 'sigmoid'})
            )
        }

        model.add(
            tf.layers.dense({ units: output[0].length, activation: 'sigmoid' })
        );

        model.compile({
            optimizer: tf.train.sgd(0.1),
            loss: 'meanSquaredError'
        });

        const epochs = 50;
        const modelName = 'helloWorld';

        model.fit(inputTensor, outputTensor, {
            epochs: epochs,
            shuffle: true,
            callbacks: {
                onEpochEnd: async (epoch, { _loss }) => {
                    // console.log('epochs left: ', epochs - epoch);
                    if(epoch == epochs - 1){
                        model.save(`localstorage://${modelName}`).then(() => {
                            // window.localStorage.setItem(
                            //     `tensorflowjs_models/${modelName}/inputNames`, 
                            //     new Array(numInputs).fill(0).map(() => "testing")
                            // )

                            let modelJSON = {};
                            modelJSON.weight_data = window.localStorage.getItem(`tensorflowjs_models/${modelName}/weight_data`);
                            modelJSON.layers = layers;
                            modelJSON.inputNames = new Array(numInputs).fill(0).map(() => 'testing')

                            callback(JSON.stringify(modelJSON));
                        });
                    }
                }
            }
        })

    },

    timeMetaBlockCreation: function() {
        console.time()
        util.generateMetaBlock(0, () => {
            console.timeEnd();
        })
    },

    downloadRandomModel: function () {
        let versions = util.getNumVersions();
        let randomVersionNum = versions-1; //this.getRandomInt(versions, 0);
        let k = 0;

        console.time('search time');

        util.forEachVersions((version) => {
            if(k == randomVersionNum){
                console.timeEnd('search time');
                console.time('download network')

                // util.downloadNetwork(version, (network) => {
                //     console.timeEnd('download network')
                //     console.time('construct network')
                //     App.constructModel(network, (_model) => {
                //         console.timeEnd('construct network')
                //     })
                    
                // })
            }
            k++;
        })
        
    },

    constructNewModel: function (layers, callback = console.log) {
        const model = tf.sequential();

        model.add(
            tf.layers.dense({ inputShape: [layers[0]], units: layers[0], activation: 'sigmoid' })
        );

        for(let i = 1; i < layers.length; i++){
            model.add(
                tf.layers.dense({units: layers[i], activation: 'sigmoid' })
            );
        }

        const modelName = 'helloWorld';

        const parameters = model.getWeights().reduce((a,b) => a+b.size, 0);

        model.save(`localstorage://${modelName}`).then(() => {
            window.localStorage.setItem(
                `tensorflowjs_models/${modelName}/inputNames`, 
                new Array(layers[0]).fill(0).map(() => "testing")
            )

            let modelJSON = {};
            modelJSON.weight_data = window.localStorage.getItem(`tensorflowjs_models/${modelName}/weight_data`);
            modelJSON.layers = layers;
            modelJSON.inputNames = new Array(layers[0]).fill(0).map(() => 'testing')
            
            const startTime = Date.now()
            

            tf.loadModel(`localstorage://${modelName}`).then((model) => {
                const endTime = Date.now();
                const totalTime = endTime - startTime;

                callback(totalTime, parameters)
            });

        });

    },

    saveToCSV: function (arg) {
        let excelData = '';

        arg.forEach(( rowItem, rowIndex ) => {   
    
            if (0 === rowIndex) {
                // This is for header.
            rowItem.forEach((colItem, colIndex) => {
                 excelData += colItem + ',';
            });
            excelData += "\r\n";
             } else {
                // This is data.
                rowItem.forEach((colItem, colIndex) => {
               excelData += colItem + ',';   
            })
               excelData += "\r\n";       
             }
        });

        excelData = "data:text/csv," + encodeURI(excelData);

        let a = document.createElement("A");
        a.setAttribute("href", excelData);
        a.setAttribute("download", "data.csv");
        document.body.appendChild(a);
        a.click();
    },

    constructRandomModels: function (n, endfn=this.saveToCSV) {
        const times = new Array(n+1).fill(0).map(_e=>[0,0])
        times[0] = ['times', 'parameters', 'total points = ', n];

        testing.times = times;

        const genLayers = () => {
            return [
                    3, 
                    this.getRandomInt(128,1),
                    this.getRandomInt(128,1),
                    this.getRandomInt(96,1),
                    this.getRandomInt(16,1),
                ]
        }

        const genCallback = (i=1) => {
            const obj = times[i];
            return (time, params) => {
                obj[0] = time;
                obj[1] = params;
                if(i < n) this.constructNewModel(genLayers(), genCallback(i+1));
                else endfn(testing.times)
            }
        }

        this.constructNewModel(genLayers(), genCallback());
    },

    downloadNEarliestModel: function (n = 0) {
        let versions = util.getNumVersions();
        // let randomVersionNum = this.getRandomInt(versions, 0);
        let k = 1;

        if(!App.metaBlock.lastBlock){

            console.time('search time');

            util.forEachVersions((version) => {
                if((!n && k == versions) || (n && k == n)){
                    console.log(version)
                    
                    console.timeEnd('search time');
                    console.time('download network')
    
                    util.downloadNetwork(version, (network) => {
                        console.timeEnd('download network')
                        console.time('construct network')
                        App.constructModel(network, (_model) => {
                            console.timeEnd('construct network')
                        })
                        
                    })
                }
                k++;
            })
        }else {
            util.forEachVersions((version) => {
                if((!n && k == versions) || (n && k == n)){
                    console.log(version)
                    
                    console.time('search time');
    
                    util.downloadNetwork(version, (network) => {
                        console.timeEnd('search time')
                        console.time('construct network')
                        App.constructModel(network, (_model) => {
                            console.timeEnd('construct network')
                        })
                        
                    })
                }
                k++;
            })

        }
        
    },

    measureUpload: function (layers) {
        let modelName = `model${modelNum++}`;

        this.createModel(layers, (networkJSON) => {
            console.time("upload time");
            util.upload(modelName, networkJSON, `${modelName} description`);
        })

    },

    uploadRandomModel: function(num) {
        if(num)
            modelNum = num;
        let modelName = `model${modelNum++}`;
        let numInputs = this.getRandomInt(5,1);
        let numOutputs = this.getRandomInt(5,1);
        let numLayers = this.getRandomInt(3,1);
        let numPerLayer = this.getRandomInt(128,64);

        let layers = [numInputs];
        for(let i = 0; i < numLayers; i++)
            layers.push(numPerLayer);
        layers.push(numOutputs);

        this.createModel(layers, (modelJSON) => {
            // console.time("upload time");
            util.upload(modelName, modelJSON, `${modelName} description`);
        })

    },

    uploadComplete: function () {
        if(modelNum > 1){
            console.timeEnd("upload time");
        }
    },

    measureBlockChainSize: function (){
        web3.eth.getBlockNumber((_e, bn) => {
            for(let i = 0; i <= bn; i++){
                web3.eth.getBlock(i, (_e, block) => {
                    let transaction = block.transactions[0];
                    if(transaction)
                        web3.eth.getTransaction(transaction, (_e, trans) => {
                            if(trans.blockNumber > 1){
                                console.log(trans.blockNumber)
                                // console.log(trans);
                                console.log(trans.input.length, 'bytes');
                                console.log(trans)
                            }
                            
                        });
                })
            }
        })
    }

}




