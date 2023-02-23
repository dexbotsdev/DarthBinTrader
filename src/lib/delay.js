const delay=(s)=>{
    return new Promise((resolve,reject)=>{
        setTimeout(function(){ 
            console.log("...waiting ",s,"sec ...");
            resolve();
        }, s*1000);
    });

}

export default delay;