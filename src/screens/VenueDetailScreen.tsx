import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { RootStackParamList } from "../navigations/RootNavigation";
import { venueAPI } from "../service/apis/venues";
import { useState } from "react";
import { Venue } from "../types/Venue";
import Loader from "../components/UI/loader";
import { VenueResponse } from "../types/VenueResponse";

type venueDetailProps = NativeStackScreenProps<RootStackParamList, 'vDetail'>;

const VenueDetail = ({navigation, route}: venueDetailProps) =>{
    const venueId = route?.params?.venueId;
    const [venue, setVenue] = useState<VenueResponse | null >(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchVenueDetail = async()=>{
        try{

            console.log('Fetching venue detail....')
            
            const res = await venueAPI.getById(venueId);

            if(res.success){
                console.log('Fetched menu detail : ', res.data)
                setVenue(res.data as VenueResponse);
                return;
            }


        }catch(error){
            console.error('Error while fetching venue detail',error);
        }
    }

    if(loading){
        return<Loader overlay label="Fetching venue detail ..."/>
    }
    return(
        <View>

        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex:1,
    }
});

export default VenueDetail;