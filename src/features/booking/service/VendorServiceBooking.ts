export const dummyCall = async(data:any) =>{
    try{
        console.log('dummy call..')
        setTimeout(() => {
            console.log('dummy')
        }, 5000);
    }catch(error){
        console.error('Error: ', error);
        throw error
    }
}