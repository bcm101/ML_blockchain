let drawStars;
import('./drawStars.js').then((ds) => drawStars = ds.drawStars);

let utilCon, util;
import('./util.js').then((ut) => utilCon = ut.util);

let testing;
import('./testing.js').then(t => testing = t.testing)

App = {
    web3Provider: null,
    contracts: {},
    account: "0x0",
    owner: "0x0",
    model: {
        inputShape: 0,
        outputShape: 0,
        loadedModel: {},
        version: ""
    },
    allowAllUpload: true,
    instance: {},

    init: function() {

        if(typeof web3 !== "undefined"){
            // provided by metamask
            App.web3Provider = ethereum;
            web3 = new Web3(App.web3Provider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider(
                "http://localhost:7545"
            )
            web3 = new Web3(App.web3Provider);
        }

        $.getJSON("MLManager.json", function(MLManager){
            App.contracts.MLManager = TruffleContract(MLManager);
            App.contracts.MLManager.setProvider(App.web3Provider);
        })
        .then(() => {
            try{
                web3.eth.getCoinbase(function(err, account) {
                    if(err === null && account){
                        App.account = account;

                        App.contracts.MLManager.deployed().then(instance => {
                            App.instance = instance;
                            instance.owner().then(owner => {
                                App.owner = owner;
                                App.addVersionListener();
                                util = utilCon((ut) => {
                                    let callback = () => {
                                        let version = $("select#dropdown option:selected").val();
                                        ut.getModelInfo(version, (_v, description, _o)=> App.renderDescription(description))
                                    }
                                    ut.forEachVersions((version) => {
                                        $('#dropdown').append($('<option>', {
                                            value: version,
                                            text: version
                                        }))
                                    }, callback)
                                });
                            });
                        })

                    }else{
                        throw err;
                    }
                })
                
            }catch(e){
                console.log("this is an error: " + e);
            }
        })
    },

    addVersionListener: function() {
        
        App.instance.new_version(
            {},
            {
                fromBlock: "latest",
                toBlock: "latest"
            }
        ).watch( (err, event) => {
            util = utilCon();
            testing.uploadComplete();
        })
    },

    upload: function(vers, network, description) {
        util.upload(vers, network, description)
    },
    
    update_num_versions: function() {
        App.instance.numVersions().then(
            n => $('#num_versions').text(n.toNumber() + " total versions")
        )
        
    },

    updateVersions: function(version) {
        App.update_num_versions();
        App.populateDropdown();
        App.updateRating(version);
        $('#loaded-content').show();
        $('#latest_version').text("latest: " + version);
    },

    populateModel: function() {
        $("#model").empty()
        $("#model").append("<tr style='border-bottom: 1px solid black;'><th></th><th>Car Parameters</th><th>Price</th></tr>")
        $("#model").append(new Array(Math.max(App.model.inputShape, App.model.outputShape)).fill(0).map((_e,i) => {
            row = "<tr>";

            if(App.model.inputShape > i){
                row += `<th>${App.model.inputNames[i]}</th>`
                row += `<th><input class='input-cell' id='input-${i}'></input></th>`;
            }else{
                row += `<th></th>`
                row += `<th></th>`;
            }

            if(App.model.outputShape > i)
                row += `<th><input class='output-cell' id='output-${i}' READONLY></input></th>`;

            row += "</tr>";
            return row;
        }))


        let tr = "<tr style='border-top: 1px solid black;'>";
        tr += "<th id='test'>predict with model: </th>";
        tr += "<th><button id='predict'>predict</button></th>";
        $('#model').append(tr + "</tr>");

        tr = "<tr>";
        tr += "<th>review the model: </th>";
        tr += '<th><input id="review-input" placeholder="int" style="width: 25px"></input></th>';
        tr += `<th><button id='review'>submit</button></th>`;
        $('#model').append(tr + `</tr>`);

        $("#predict").on("click", (event)=>{
            inputs = $('.input-cell')
            // get inputs
            .map(function(){
                return $(this).val();
            }).get()
            // make inputs into a double
            .map((e) => parseFloat(e));

            input_tensor = tf.tensor([inputs]);
            
            App.model.loadedModel.predict(input_tensor).data().then(arr => {
                $('.output-cell')
                .map(function(e,i){
                    if(!isNaN(arr[e])){
                        $(this).val(arr[e]);
                        $('#predict').css("background-color","green");
                    }else{
                        $(this).val("error");
                        $('#predict').css("background-color","red");
                    }
                    
                })
            })
        })

        $('#review').on("click", (event) => {
            let v = parseInt($("#review-input").val());
            if(!isNaN(v)){
                App.submitReview(App.model.version, v);
                $('#review').css("background-color","green");
            }else{
                $('#review').css("background-color","red");
            }
        })

        util.getRatingInfo(App.model.version, (numRatings, averageRating) => {
            if(numRatings > 0)
                App.populateRating(averageRating / 1000, numRatings);
        })

    },

    submitReview: function(version, review) {
        util.addRating(version, review);
    },

    renderDescription: function(description) {
        $("#description").empty();
        $("#description").text(`description of model version:`);
        $("#description").append(`<div>${description}</div>`);
    },

    populateRating: function(rating, numRatings) {

        $('#num-of-ratings').text(`${numRatings}`)
        $('#average-rating').text(`${rating}`)
        $('#num-of-ratings-text').text("Average Ratings for Model: ");

        let canvas = document.getElementById("rating-canvas");
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStars(ctx, 0, 40, 40, 5, 8, 5, rating)
    },

    constructModel: function(modelInfo, callback) {


        let network_info = JSON.parse(modelInfo);

        if(!network_info.weight_data)
            network_info = JSON.parse(network_info);

        let weight_data = network_info.weight_data;
        let layers = network_info.layers;

        if(layers.length < 2) return false;

        let numInputs = layers[0];
        let numOutputs = layers[layers.length - 1];
        let numLayers = layers.length - 2;

        let model = tf.sequential();
        model.add(
            tf.layers.dense({ inputShape: [numInputs], units: numInputs, activation: 'sigmoid' })
        );

        for(let i = 1; i < numLayers - 1; i++){
            model.add(
                tf.layers.dense({units: layers[i], activation: 'sigmoid'})
            )
        }

        model.add(
            tf.layers.dense({ units: numOutputs, activation: 'sigmoid' })
        );

        model.compile({
            optimizer: tf.train.sgd(0.1),
            loss: 'meanSquaredError'
        });

        let modelName = 'currentModel';

        model.save(`localstorage://${modelName}`).then(() => {
            window.localStorage.setItem(
                `tensorflowjs_models/${modelName}/weight_data`,
                weight_data
            )
            tf.loadModel(`localstorage://${modelName}`).then((model) => callback(model));
            
        });

    },

    initEvents: function() {

        $("#load-selected").on("click", (event) => {
            let version = $("select#dropdown option:selected").val();
        
            util.downloadNetwork(version, (network) => {
                App.constructModel(network, (model) => {
                    App.model.loadedModel = model;
                    
                    const model_JSON = JSON.parse(App.model.loadedModel.toJSON());
                    App.model.inputShape = model_JSON.config[0].config.batch_input_shape[1];
                    App.model.outputShape = model_JSON.config[model_JSON.config.length-1].config.units;
                    App.model.version = version;

                    let inputNames = JSON.parse(network).inputNames;

                    if(!inputNames)
                        inputNames = JSON.parse(JSON.parse(network)).inputNames;

                    App.model.inputNames = inputNames;

                    App.populateModel();
                })

            })

        })

        $("#dropdown").on("change", (event) => {
            let version = $("select#dropdown option:selected").val();
            util.getModelInfo(version, (_v, description, owner) => {
                App.renderDescription(description)
            })
        })

        let buttons = $(".tablinks")
        for(let i = 0; i < buttons.length; i++)
            $(buttons[i]).on("click", e => {
                if($(`.tab${i+1}`).css('visibility') == 'visible'){
                    $('.tabcontent').css('visibility', 'hidden')
                    return 0;
                }
                $(`.tab${i+1}`).css('visibility', 'visible');
                
                for(let j = 0; j < buttons.length; j++){
                    if(j == i) continue;
                    $(`.tab${j+1}`).css('visibility', 'hidden');
                }
            })
        
        $("#submit-network").on("click", () => {

            let vup = $("#versionUP");
            let nup = $("#networkUP");
            let dup = $("#descriptionUP");

            let version = vup.val().trim();
            let network = nup.prop("files")[0];
            let description = dup.val().trim();

            let fr = new FileReader();
            fr.onload = () => {
                if(version != "" && description != "" && network && fr.result){
                    // console.log(version, fr.result, description)
                    util.upload(version, fr.result, description);
                    vup.val('');
                    nup.val('');
                    dup.val('');
                }
            } 

            fr.readAsText(network);
        })

        $('#generate-meta-block').on("click", () => {
            util.generateMetaBlock(0, (metaBlock) => $('#last-block').text(metaBlock.lastBlock));
            
        });

        $('#download-meta-block').on("click", () => {
            if(App.metaBlock.lastBlock > 0)
                util.download('meta-block.json', JSON.stringify(App.metaBlock))
        })

        $('#submit-meta-block').on('click', () => {
            let metaBlock = $('#load-meta-block').prop("files")[0];
            let fr = new FileReader();
            fr.onload = () => {
                if(metaBlock && fr.result){
                    App.metaBlock = JSON.parse(fr.result);
                    $('#last-block').text(App.metaBlock.lastBlock)
                }
            }
            fr.readAsText(metaBlock);
        })

    }
}

$(function() {
    $(window).load(function() {
        App.init();
        App.initEvents();
    });
});
