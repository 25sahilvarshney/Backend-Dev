const fs=require("fs");
function booking(req,res){
    try{
        const {moviename, movieid, userId}=req.body;
        const bookingData={
            moviename,
            movieid,
            userId
        }
        fs.writeFileSync("booking.json",JSON.stringify(bookingData));
        res.status(200).send("Booking successful");
        let tickets=[];
        if(fs.existsSync("booking.json")){
            const data=fs.readFileSync("booking.json","utf-8");
            tickets=JSON.parse(data);
        }
        tickets.push(bookingData);
        fs.writeFileSync("booking.json",JSON.stringify(tickets,null,2));
        const ticketsData=fs.readFileSync("booking.json","utf-8");
        res.status(200).send(ticketsData);
        const type={
            moviename:String,
            movieid:Number,
            userId:Number
        }
        tickets.push(type);
        fs.writeFileSync("booking.json",JSON.stringify(tickets,null,2));
        const totalpriceTicklets=tickets.length*150;
        res.status(200).send(`Total price of tickets is ${totalpriceTicklets}`);
        const vipSeats=tickets.filter(ticket=>ticket.seatType==="VIP").length;
        const regularSeats=tickets.filter(ticket=>ticket.seatType==="Regular").length;
        res.status(200).send(`VIP Seats: ${vipSeats}, Regular Seats: ${regularSeats}`);
    
        // tickets pricing according to persons are regular or vips in the cinema hall 
        const vipSeatPrice=200;
        const regularSeatPrice=100;
        const totalVipPrice=vipSeats*vipSeatPrice;
        const totalRegularPrice=regularSeats*regularSeatPrice;
        const grandTotal=totalVipPrice+totalRegularPrice;
        res.status(200).send(`Total Price - VIP: ${totalVipPrice}, Regular: ${totalRegularPrice}, Grand Total: ${grandTotal}`);

        // applying the discounts
        const vipDiscount=0.12;
        const regularDiscount=0.05;
        const discountedVipPrice=totalVipPrice-(totalVipPrice*vipDiscount);
        const discountedRegularPrice=totalRegularPrice-(totalRegularPrice*regularDiscount);
        const totalAfterDiscount=discountedVipPrice+discountedRegularPrice;
        res.status(200).send(`After Discount - VIP: ${discountedVipPrice}, Regular: ${discountedRegularPrice}, Total: ${totalAfterDiscount}`);

        // vips tickets and regular tickets count
        const vipCount=tickets.reduce((count,ticket)=>{
            return ticket.seatType==="VIP"?count+1:count;
        },0);
        const regularCount=tickets.reduce((count,ticket)=>{
            return ticket.seatType==="Regular"?count+1:count;
        },0);
        res.status(200).send(`Ticket Count - VIP: ${vipCount}, Regular: ${regularCount}`);

        // total bill generate
        const totalBill=tickets.reduce((total,ticket)=>{
            return ticket.seatType==="VIP"?total+vipSeatPrice:total+regularSeatPrice;
        },0);
        res.status(200).send(`Total Bill Amount: ${totalBill}`);

    }catch(error){
        console.error(error);
        res.status(500).send("Server error");
    }
}