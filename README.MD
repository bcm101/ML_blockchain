# ML-Blockchain

This is a basic implementation of ML models hosted over a blockchain network. 

## Installation

Use [git](https://git-scm.com/) to download the files using:

```bash
git clone [url]
```

or download the zip files.

## Truffle and Ganache

download [Node and NPM](https://nodejs.org/en/) and install the following packages:

```bash
npm install -g truffle
npm install -g ganache-cli
```

Ensure that both were installed correctly using:

```bash
npm -v
node -v
```

## Metamask

Metamask is how our site will interact with the blockchain. Download the metamask chrome extension [here](https://metamask.io/download/).

Create an account on metamask. Click the create a new wallet button shown [here](https://prnt.sc/BR283wtEx4pJ). Agree to the terms and services. You will then be asked to insert a password twice and select the checkbox shown [here](https://prnt.sc/Re26O6PtBS5n). Upon continueing the next screen, you should watch the video about the security of Metamask. You should now hit the secure my wallet option. This will bring you to a similar screen shown [here](https://prnt.sc/VmrLxHpE-J-U). You should click to reveal your secret pass phrase, and then copy to pass phrase to a secure destination. Upon clicking the next screen, you will simply enter the missing words from the pass phrase you just copied down as shown [here](https://prnt.sc/Ufk32VOFee7z). Lastly, just hit confirm to continue to the next section.

Open a new command line prompt and enter:

```bash
ganache-cli -h [yourIPAddress] -m HelloWorld
```

This will create a simulation of ethereum being ran from your local computer. ```-h [yourIPAddress]``` is simply telling it to run from the given IP address, and ```-m HelloWorld``` is giving it a mnemonic that it will deterministically generate the random accounts from. This will be make future steps much easier as in case you need to restart this CMI for some reason, you will not have to deal with entirely new accounts in metamask. Upon running this command, you should be given this exact [output](https://prnt.sc/Ke6N1lLIRUxq) but with a different IP address.

You should now open metamask and click your account in the top right corner. In the pop up menu, that should look like [this](https://prnt.sc/HE0UM3FKjUPl), select the import account option which has been highlighted in the image. In the following screen, enter the private key: ```0x407ffaead7e2853f2a1bfa6b4757e1f12ab47b62e38ba11ffb5e0b1a132123c1```

This private key belongs to the first account listed in Ganache. This account will default be the owner of all smart contracts uploaded, therefore in order for full use of this project you would need to use this private key. Any other private key would be acceptable for an experience not unique to the owner.

Lastly, in order for metamask to see this network we have created, you have to allow metamask to interact with test networks. At the top of the metamask window, click the part that says Ethereum Mainnet. You should now get a pop up that looks like [this](https://prnt.sc/l3TI_VzJymAU). Click the highlighted section, which will take you to [this option](https://prnt.sc/xNSBlQgH8VO3). Make sure to click the switch so it is in the ```On``` position. Now, back in the main tab, you should be able to click on the Ethereum Mainnet part again, and you should now click on the section that offers to add a new network, highlighted [here](https://prnt.sc/RdapjE5A5SKR). You should now have been redirected to a page showing different network available to you. Select the "Add a network manually" option, highlighted [here](https://prnt.sc/eQ86oll679n5). This should take you to the following [page](https://prnt.sc/_Dhy6MvSBpxq) where you can fill in the given information. The highlighted section is the URL that the ganache blockchain simulation is listening on. This will be your IP address and then the port number 8545. When prompted to switch to the new network say yes.

You should now see you have 100 Eth in our new test network. 

## Compiling and running

Before running, you must adjust the code in truffle-config.js based on the screenshot provided [here](https://prnt.sc/2N3Wi-Aft5yB).

After making that change, open a new command line terminal and open the project folder. Run the following command from the directory containing the project files.

```bash
truffle compile
```

This will create a build folder which will have json representations of all contracts compiled.

Next, we can use upload our contracts to the local network provided by Ganache using:

```bash
truffle migrate --reset
```

This will deploy this contract under the address of the first account listed in Ganache. If you open the metamask menu again, you will now see a slight change in our owner account's Eth funds. This is due to the cost in uploading the contract. Moreover, if you open the Ganache-cli command prompt, you should be able to see that a new block was added to the blockchain. This is shown in the screenshot [here](https://prnt.sc/NjoJpLyopTkq).

In this same terminal, you can now run to install all necessary node dependencies:

```bash
npm install
```

Lastly, you can run the liveserver start scripts by running:

```bash
npm run dev
```

This should open the site as ```localhost:3000```.

## Connecting the website
Firstly, one should change the url to ```[yourIPAddresss]:3000``` and reload the page. Example: For my site, the URL is: ```http://134.88.137.197:3000/```.

Next, before clicking the login button, you have to connect this site to metamask (logging in without connecting will create an error as it can't fetch data from the blockchain). 

To do this, open metamask by clicking the extension while on the site we have made run. Click the three dots in the metamask home menu to expand the following screen shown [here](https://prnt.sc/IdNWXUk4f4DF). Select the highlighted option, which will then give the option to manually connect as shown [here](https://prnt.sc/RTtrqAaTeS2z). Lastly, you must now select which account to connect, and you should only select the second one which is the one we just added. This is shown [here](https://prnt.sc/zj5vFQMxAVw-). Lastly, click next and then click connect.

## Interacting with the website

Please now click the login button. Open the console by hitting F12 to check if you recieved an error. If you receive an error, you should clear your metamask account's nonce data as it is likely an error with metamask.

Now you are given the option to upload a model to the blockchain. You should get a screen that looks like [this](https://prnt.sc/fCXhpP-H5z3B). There is currently no models to load, so the dropdown menu will be empty. 

Please click the upload button, which will now open a screen that looks like [this](https://prnt.sc/Vw5jN4pDrW5q). You can now enter any version number and description into the two input text boxes. Upon entering all this information, you may now select the select file option. Please upload the model.txt file that came with this project and is stored within the model folder. Your screen should now look something like [this](https://prnt.sc/dAfGHdyVlaIj).

You may now hit submit. You should now get a metamask pop up that looks like [this](https://prnt.sc/qhFO_v_qRycG). Initially, the gas estimate will be 0 as Metamask attempts to estimate the cost of the gas. After about 30 seconds (most likely far less but that is dependent on your connection), it should allow you to hit confirm. 

Upon a few more seconds of waiting, you should have a new screen that looks like [this](https://prnt.sc/b-AO9H_HIEPQ). This screen will happen after the upload event has been emitted by the smart contract, signalling it has completed successfully.  Moreover, you can confirm that a new block has been added again in the command prompt running ganache-cli as you should have something like [this](https://prnt.sc/9Pgc289UhRWr)!

Now, all that is left is to load the model! To do this, you simply have to select the model from the now populated dropdown, and hit load selected. This will give you several input fields, and several output fields (depending on the model). For a model with only 5 input nodes and 1 output node, this should look something like [this](https://prnt.sc/v2HmLuFf_IiG). If you fill in all the input fields with numbers and hit predict, you should now see the output of the model you uploaded!

## Making my own models

I have made a short script that will help to create models for testing. This is found in the model folder, and is called ```making-models.html```. If you want to verify that the model is the same as one you can create here, you can easily using slight modifications to this script as well. 

## Interacting with other computers on the same blockchain network

The guiding principle of blockchain is that multiple peers are able to interact with the same blockchain by all peers having a local copy of the chain. However, this principle is violated here, as the only 'peer' on this network is ganache, with metamask doing all the connecting for us. This is nice for development but poor for understanding of the intermechanisms of blockchain. However, with this all this in mind, it is meaningful to show that the model is saved on the actual blockchain rather than in localstorage somewhere. To do this, we must perform a few actions on a new computer on the same network.

Firstly, we must log into the metamask we created earlier on the new computer. Next you must import one of the accounts like we did before. However, this time lets choose a different account with the following private key: ```0x30ff258febc155d6d0877b115e32f89e837d8929d576e8cee5feea2f7925d683```. Now we should see that we have 100$ in Eth in metamask, as shown [here](https://prnt.sc/mb_OTnAGDbte). 

Next we need to run another website, either as another port on the first computer or in the new computer. Either way, you should run the command in the project directory:

```bash
npm run dev```

On the browser of the new computer, enter the URL to the now running website. If you ran the command on the first computer, navigate to: ```http://[yourIPAddress]:3002```. If you ran the command on the new computer, navigate to ```[yourNewIPAddress]:3002``` where ```[yourNewIPAddress]``` represents the IP address of the new computer. 

Up on opening the new webpage, you should see [this](https://prnt.sc/JtTkckNpZF27). The new information has been downloaded from the blockchain automatically! Next, lets try uploading something and see if it will update on the webpage on the first computer. You should have something that looks like [this](https://prnt.sc/o1kI82gLXeje). Upon hitting submit, you should go back to the webpage on the first computer. The site should update automatically showing that a new version is available. 

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

