let drawStars;
import('./drawStars.js').then((ds) => drawStars = ds.drawStars);

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
        
        $("#loaded-content").hide();
        $("#upload").hide();

        // initializing web3
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

        
        // // initializing contract
        $.getJSON("MLManager.json", function(MLManager){
            App.contracts.ML = TruffleContract(MLManager);
            App.contracts.ML.setProvider(App.web3Provider);
        })

    },

    login: function() {

        try{
            web3.eth.getCoinbase(function(err, account) {
                if(err === null && account){
                    App.account = account;
                    App.contracts.ML.deployed().then(instance => {
                        instance.owner().then(owner => {
                            App.owner = owner
                            
                            // rendering after log in button
                            $("#login").hide();

                            instance.numVersions().then(v => {
                                if(v > 0)
                                    instance.versions(v-1).then(version => {
                                        App.updateVersions(version);
                                    })
                            })

                            App.populateUpload();
                            App.instance = instance;
                        });
                    })

                }else{
                    throw err;
                }
            })
            

        }catch(e){
            console.log("this is an error: " + e);
        }

        
    },

    upload: function(vers, network, description) {
        App.contracts.ML.deployed()
            .then(function(instance) {
                return instance.upload(vers, network, description, { from: App.account })
            }) 
    },
    
    update_num_versions: function() {
        App.contracts.ML.deployed()
            .then(instance => instance.numVersions().then(
                n => $('#num_versions').text(n.toNumber() + " total versions"))
        )
    },

    updateVersions: function(version) {
        App.update_num_versions();
        App.populateDropdown();
        App.updateRating(version);
        $('#loaded-content').show();
        $('#latest_version').text("latest: " + version);
    },

    updateRating: function(version){
        App.instance.getNumRatings(version).then(ratings => {
            if(ratings > 0){
                App.instance.getAverage(version).then(rating => {
                    App.populateRating(rating.toNumber() / 1000);
                })
            }
        })
    },

    populateDropdown: function() {

        let dropdown = $('#dropdown').empty()

        App.contracts.ML.deployed()
            .then(instance => instance.numVersions().then(
                n => {
                    for(let i = n.toNumber() - 1; i >= 0 ; i--){
                        instance.versions(i).then(v => {
                            dropdown.append(`<option>${v.toString()}</option>`);

                            if(i == n.toNumber() - 1)
                                instance.getDescription(v).then(desc => App.renderDescription(desc));
                        })
                    }
                }
        ))

    },

    populateUpload: function () {
        if(App.owner == App.account || App.allowAllUpload) {
            $("#upload").show()

            $("#toggle-upload").on("click", () => {
                $("#toggle-upload").hide()
                $("#uploadables").append("<input id='versionUP' placeholder='version'></input>");
                $("#uploadables").append("<input id='descriptionUP' placeholder='description'></input>");
                $("#uploadables").append("<div><input id='networkUP' type='file' accept='.txt, .json, .bin'></input></div>");
                $("#uploadables").append("<button id='submit-network' type='button'>submit</button>");

                
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
                            App.upload(version, fr.result, description);
                            vup.val('')
                            nup.val('')
                            dup.val('')
                        }
                    } 

                    fr.readAsText(network);
                })
            })
        }
    },

    populateModel: function() {
        $("#model").empty()
        $("#model").append("<tr><th>Inputs</th><th>Outputs</th></tr>")
        $("#model").append(new Array(Math.max(App.model.inputShape, App.model.outputShape)).fill(0).map((e,i) => {
            row = "<tr>";

            if(App.model.inputShape > i)
                row += `<th><input class='input-cell' id='input-${i}'></input></th>`;

            if(App.model.outputShape > i)
                row += `<th><input class='output-cell' id='output-${i}' READONLY></input></th>`;

            row += "</tr>";
            return row;
        }))
        $("#model").append(`predict with model: <button id='predict'>predict</button>`);
        $("#model").append(`<div><div>review the model: <input id="review-input" placeholder="int" style="width: 25px"></input></div><button id='review'>submit</button></div>`);

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

    },

    submitReview: function(version, review) {
        App.contracts.ML.deployed().then(instance => {
            instance.addRating(version, review, { from: App.account });
        })
    },

    renderDescription: function(description) {
        $("#description").empty();
        $("#description").text(`description of network version:`);
        $("#description").append(`<div>${description}</div>`);
    },

    populateRating: function(rating) {
        let canvas = document.getElementById("rating");
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStars(ctx, 0, 40, 20, 5, 4, 5, rating)
    },

    initEvents: function() {
        $("#login-button").on("click", (event) => {
            App.login();
        })

        $("#load-selected").on("click", (event) => {
            let version = $("select#dropdown option:selected").val();
            App.contracts.ML.deployed().then(instance => {
                instance.download(version).then(network => {
                    network_info = JSON.parse(network);
                    keys = Object.keys(network_info);

                    keys.forEach(key => {

                        newKey = key.split('/');
                        newKey[1] = version;
                        newKey = newKey.join('/');

                        window.localStorage.setItem(newKey, network_info[key])
                    });

                    tf.loadModel(`localstorage://${version}`).then((e) => {

                        App.model.loadedModel = e;

                        const model_JSON = JSON.parse(App.model.loadedModel.toJSON());
                        App.model.inputShape = model_JSON.config[0].config.batch_input_shape[1];
                        App.model.outputShape = model_JSON.config[model_JSON.config.length-1].config.units;
                        App.model.version = version;

                        App.populateModel();

                    })

                })
            })
        })

        $("#dropdown").on("change", (event) => {
            let version = $("select#dropdown option:selected").val();
            App.contracts.ML.deployed().then(instance => {
                instance.getDescription(version).then(description => {
                    App.renderDescription(description);
                })
                App.updateRating(version);
            })
        })
    }

}

$(function() {
    $(window).load(function() {
        App.init();
        App.initEvents();
    });
});
