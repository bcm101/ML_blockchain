
export function util(callback = () => {}){

    let numVersions = 0;
    App.metaBlock = {
        lastBlock: 0,
        models: {}
    };
    let Contracts = {};
    let numRatings = 0;
    let totalBlocks = 0;

    function goForwardBlock(blockNumber, endBlock, stepFun, endFun = (e)=>e, iter=(n)=>n+1){
        if(blockNumber !== endBlock){
            web3.eth.getBlock(blockNumber, (_e, block)=>{
                if(block?.transactions[0])
                    web3.eth.getTransactionReceipt(block.transactions[0], (_e, transaction)=>{
                        let cont = () => goForwardBlock(iter(blockNumber), endBlock, stepFun, endFun, iter);
                        cont.endFun = endFun;
                        stepFun(transaction, blockNumber, cont);
                    })
                else
                    goForwardBlock(iter(blockNumber), endBlock, stepFun, endFun, iter);
            })
            
        }else{
            endFun()
            return true;
        }
    }

    let ret = {
        generateMetaBlock: function(fromBlock = 0, callback = (metaBlock) => {}) {
            let i = 0, j = 0;
            function addModelsToMetaBlock(transaction, blockNumber, cont){
                if(transaction.to === App.instance.address.toLowerCase()){
                    if(transaction.logs[0]){
                        App.instance.versions(i++).then((version) => {
                            App.instance.MLs(version).then((contract) => {
                                let instance = Contracts.MLContract.at(contract);
                                App.metaBlock.models[version] = {
                                    contractAddress: contract,
                                    blockNumber: transaction.blockNumber,
                                    latestRatingBlock: transaction.blockNumber
                                }
                                cont()
                            })
                        })
                    }
                    else{
                        App.instance.Ratings(j++).then((contract) => {
                            let instance = Contracts.RatingContract.at(contract);
                            instance.version.call().then(version => {
                                App.metaBlock.models[version].latestRatingContract = contract;
                                App.metaBlock.models[version].latestRatingBlock = blockNumber;
                                cont()
                            })
                            
                        })
                    }
                }else cont()
            }
            App.metaBlock.lastBlock = totalBlocks;
            goForwardBlock(fromBlock, totalBlocks+1, addModelsToMetaBlock, () => callback(App.metaBlock));
            
        },

        addRating: function(version, rating){
            this.getRatingInfo(version, (numRatings, averageRating)=>{
                App.instance.addRating(version, numRatings, rating, averageRating, {from: App.account})
            })
        },

        upload: function(version, network, description){
            App.instance.upload(version, network, description, { from: App.account });
        },

        downloadNetwork: function(version, callback) {
            let i = 0;
            if(App.metaBlock.models[version]){
                let MLInstance = Contracts.MLContract.at(App.metaBlock.models[version].contractAddress)
                MLInstance.network.call().then((network) => {
                    callback(network);
                })
            }else{
                goForwardBlock(0, totalBlocks+1, (transaction, _bn, cont) =>{
                    if(transaction.to === App.instance.address.toLowerCase() && transaction.logs[0]){
                        App.instance.versions(i++).then((curVersion) => {
                            if(version === curVersion)
                                App.instance.MLs(version).then((contract) => {
                                    let MLInstance = Contracts.MLContract.at(contract);
                                    MLInstance.network.call().then(callback);
                                })
                            else cont();
                        })
                    }else cont();
                })
            }
        },

        getModelInfo: function(version, callback) {
            if(App.metaBlock.models[version]){
                let MLInstance = Contracts.MLContract.at(App.metaBlock.models[version].contractAddress)
                MLInstance.getInfo.call().then(([_version, description, owner]) => {
                    callback(version, description, owner);
                })
            }else{
                let i = 0;
                goForwardBlock(0, totalBlocks+1, (transaction, _bn, cont) =>{
                    if(transaction.to === App.instance.address.toLowerCase() && transaction.logs[0]){
                        App.instance.versions(i++).then((curVersion) => {
                            if(version === curVersion)
                                App.instance.MLs(version).then((contract) => {
                                    let MLInstance = Contracts.MLContract.at(contract);
                                    MLInstance.getInfo.call().then(([_version, description, owner]) => {
                                        callback(version, description, owner);
                                    });
                                })
                            else cont()
                        })
                    }else cont()
                })
            }
        },

        getRatingInfo: function(version, callback) {
            let currentRating = numRatings-1;
            if(numRatings <= 0){
                callback(0,0);
                return false;
            };

            if(App.metaBlock.models[version]?.latestRatingContract && App.metaBlock.lastBlock === totalBlocks){
                let RatingInstance = Contracts.RatingContract.at(App.metaBlock.models[version].latestRatingContract);
                RatingInstance.getRatingInfo.call().then(([numRatings, averageRating]) => callback(numRatings.toNumber(), averageRating.toNumber()));
            }else{

                let blockNumber = 1;

                if(App.metaBlock.models[version]?.latestRatingBlock){
                    blockNumber = App.metaBlock.models[version].latestRatingBlock;
                }

                goForwardBlock(totalBlocks, blockNumber, (transaction, _bn, cont) => {
                    if(transaction.to === App.instance.address.toLowerCase()){
                        if(!transaction.logs[0])
                            App.instance.Ratings(currentRating--).then(contract => {
                                let RatingInstance = Contracts.RatingContract.at(contract);
                                RatingInstance.version.call().then((curVersion) => {
                                    if(curVersion === version){
                                        RatingInstance.getRatingInfo.call().then(([numRatings, averageRating]) => {
                                            callback(numRatings.toNumber(), averageRating.toNumber());
                                        });
                                    }else cont();
                                })
                            })
                        else cont();
                    }else cont();
                }, ()=>{
                    callback(0, 0);
                }, (n)=> n-1);
            }
        },

        forEachVersions: function(fun, callback) {
            if(numVersions === 0) return 0;
            let i = 0;
            if(App.metaBlock.lastBlock === totalBlocks)
                Object.keys(App.metaBlock.models).map(fun);
            else {
                goForwardBlock(totalBlocks, 0, (transaction, _bn, cont)=>{
                    if(transaction.to === App.instance.address.toLowerCase()){
                        if(transaction.logs[0]){
                            App.instance.versions(i++).then((version) => {
                                fun(version);
                                cont();
                            })
                        }else cont();
                    }else cont();
                }, callback, (n)=>n-1);
            }
        },

        lookUpVersionByAddress: function () {

        },

        getNumVersions: function() {
            return numVersions;
        },

        download: function (filename, text) {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        },

        findLatestVersion: function () {
            console.time("find latest")
            goForwardBlock(totalBlocks, 1, (_transaction, _b, cont) => {cont()}, () => {console.timeEnd("find latest")}, (n) => n-1);
        }

    }

    $.when(
        $.getJSON('./ML.json'),
        $.getJSON('./Rating.json')
        ).then((ML, Rating, nv, nr) => {
            Contracts.MLContract = TruffleContract(ML[0]);
            Contracts.MLContract.setProvider(App.web3Provider);
            Contracts.MLContract.defaults = {from: App.account};

            Contracts.RatingContract = TruffleContract(Rating[0]);
            Contracts.RatingContract.setProvider(App.web3Provider);
            Contracts.RatingContract.defaults = {from: App.account};

            App.instance.numVersions().then(n => {
                numVersions = n.toNumber();
                App.instance.numRatings().then(n => {
                    numRatings = n.toNumber();
                    web3.eth.getBlockNumber((_e,n)=> {
                        totalBlocks = n;
                        callback(ret);
                    });
                    
                });
            })
        })


    return ret;

}

    

