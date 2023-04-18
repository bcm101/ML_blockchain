// const $ = require('jquery')

App = {
    web3Provider: null,
    contracts: {},
    account: "0x0",
    owner: "0x0",
    model: {
        inputShape: 0,
        outputShape: 0,
        loadedModel: {},
    },
    allowAllUpload: true,
    
    init: function() {
        
        $("#loaded-content").hide();
        $("#upload").hide()

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
        $.getJSON("ML.json", function(ML){
            App.contracts.ML = TruffleContract(ML);
            App.contracts.ML.setProvider(App.web3Provider);
        })

    },

    login: function() {

        try{
            web3.eth.getCoinbase(function(err, account) {
                if(err === null && account){
                    App.account = account;
                    // console.log("test")
                    App.contracts.ML.deployed().then(instance => {
                        instance.owner().then(owner => {
                            App.owner = owner
                            
                            // rendering after log in button
                            $("#login").hide();
                            $("#loaded-content").show();

                            App.addVersionListener();
                            App.populateUpload();

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

    addVersionListener: function() {
        App.contracts.ML.deployed().then(instance => {
            instance.new_version(
                {},
                {
                    fromBlock: "latest",
                    toBlock: "latest"
                }
            ).watch( (err, event) => {
                App.update_num_versions();
                App.populateDropdown();
                $('#latest_version').text("latest: " + event.args.version);
            })
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
                                instance.descriptions(v).then(desc => App.renderDescription(desc));
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
        $("#model").append("<tr><th>Inputs</th><th>output</th></tr>")
        $("#model").append(new Array(Math.max(App.model.inputShape, App.model.outputShape)).fill(0).map((e,i) => {
            row = "<tr>";

            if(App.model.inputShape > i)
                row += `<th><input class='input-cell' id='input-${i}'></input></th>`;

            if(App.model.outputShape > i)
                row += `<th><input class='output-cell' id='output-${i}' READONLY></input></th>`;

            row += "</tr>";
            return row
        }))
        $("#model").append("<button id='predict'>predict</button>")

        $("#predict").on("click", (event)=>{
            inputs = $('.input-cell')
            // get inputs
            .map(function(){
                return $(this).val()
            }).get()
            // make inputs into a double
            .map((e) => parseFloat(e))

            if(inputs.every((e)=> isNaN(e))){
                $('#predict').css("background-color","red");
                return null;
            }

            $('#predict').css("background-color","green");

            input_tensor = tf.tensor([inputs])
            
            App.model.loadedModel.predict(input_tensor).data().then(arr => {
                $('.output-cell')
                .map(function(e,i){
                    $(this).val(arr[e])
                })
            })

            

        })

    },

    renderDescription: function(description) {
        $("#description").empty();
        $("#description").text(`description of network version:`);
        $("#description").append(`<div>${description}</div>`);
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

                        App.model.loadedModel = e

                        const model_JSON = JSON.parse(App.model.loadedModel.toJSON())
                        App.model.inputShape = model_JSON.config[0].config.batch_input_shape[1]
                        App.model.outputShape = model_JSON.config[model_JSON.config.length-1].config.units

                        App.populateModel()

                    })

                    

                })
            })
        })

        $("#dropdown").on("change", (event) => {
            let version = $("select#dropdown option:selected").val();
            App.contracts.ML.deployed().then(instance => {
                instance.descriptions(version).then(description => {
                    App.renderDescription(description);
                })
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
