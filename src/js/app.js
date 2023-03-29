// const $ = require('jquery')

App = {
    web3Provider: null,
    contracts: {},
    account: "0x0",
    owner: "0x0",
    loadedModel: {},
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
                        console.log("test")
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
        if(App.owner == App.account) {
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

                    const model = tf.loadModel(`localstorage://${version}`).then((e) => App.loadedModel = e)
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
