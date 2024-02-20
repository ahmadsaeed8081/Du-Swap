//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./proxiable.sol";

interface Token 
    {
        function transfer(address to, uint tokens) external returns (bool success);
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) ;
        function balanceOf(address account) external view returns (uint256);
        function allowance(address owner, address spender) external view returns (uint256);
    }

contract Du_Swap is Proxiable
    {

        struct order_data{
            
            address userAddress;
            uint order_no;
            address in_TokenAddress;
            address out_TokenAddress;

            uint in_Amount;
            uint out_Amount;

            uint orderPlacingTime;
            uint orderEndTime;
            uint decision;
            uint index_no;

        }
        
        struct Data{

            uint total_orders;
            bool investBefore;
            address referralFrom;
            uint totalDirects;
            uint Ref_earning;
            uint[] orders_array;

        }

        mapping(address=>Data) public user;
        mapping(uint=>order_data) orders;

        uint[] public pending_orders_arr;

        uint public  Du_price_in_usdt;
        uint public ref_percentage;
        uint public Minimum_withdraw_limit;
        uint public total_users;
        uint public total_orders;



        address public owner;
        address public DU_address;
        address public usdt_address;
        uint public fee;

        

        constructor()
        {
            owner = msg.sender;
            DU_address=0x33b0E5AB94132AF35F1B174bd28d12bB04FB8Ed8;
            usdt_address=0xd562bEA1e3ca6236e3c2626b5E1499f44E9002b7;
            Du_price_in_usdt = 0.1 ether;
            ref_percentage= 1 ether;
            Minimum_withdraw_limit = 100 ether;
            fee=1 ether;
        }

        function check_recieving_Amount( address add,uint amount) public view returns(uint)
        {
            uint recieving_amount;

            if(add==usdt_address)
            {
               recieving_amount=  amount / Du_price_in_usdt;
            }
            else if(add==DU_address)
            {
                recieving_amount=  (amount * Du_price_in_usdt)/1 ether;
            }

            return recieving_amount;
        }
        


        function du_to_usdt( uint amount, address _ref) external 
        {
            require(Token(DU_address).allowance(msg.sender,address(this))>=amount,"allowance issue");
            
            orders[total_orders].order_no = total_orders;
            orders[total_orders].in_Amount=amount;
            orders[total_orders].userAddress=msg.sender;

            orders[total_orders].out_Amount=check_recieving_Amount(DU_address,amount);
            orders[total_orders].in_TokenAddress=DU_address;
            orders[total_orders].out_TokenAddress=usdt_address;

            orders[total_orders].orderPlacingTime=block.timestamp;
            user[msg.sender].total_orders++;
            pending_orders_arr.push(total_orders);
            user[msg.sender].orders_array.push(total_orders);

            total_orders++;

            if(user[msg.sender].investBefore == false)
            { 
                total_users++;     
                user[msg.sender].investBefore=true;                                                  
            }


            if(_ref!=address(0) || _ref!=msg.sender)
            {
                
                user[msg.sender].referralFrom=_ref;
                user[_ref].Ref_earning+= (amount * ref_percentage) / 100 ether;
                user[_ref].totalDirects++;

            }
                
            Token(DU_address).transferFrom(msg.sender,address(this),amount);

        }






        function usdt_to_du(uint amount,address _ref) external 
        {
            require(Token(usdt_address).allowance(msg.sender,address(this))>=amount,"allowance issue");
            

            orders[total_orders].order_no=total_orders;
            orders[total_orders].in_Amount=amount;
            orders[total_orders].userAddress=msg.sender;
            uint temp_amount=check_recieving_Amount(usdt_address,amount);
            orders[total_orders].out_Amount=temp_amount;
            orders[total_orders].in_TokenAddress=usdt_address;
            orders[total_orders].out_TokenAddress=DU_address;

            orders[total_orders].orderPlacingTime=block.timestamp;
            orders[total_orders].orderEndTime=block.timestamp;
            orders[total_orders].decision=1;                         //0 pending. 1 approve.  2 decline.
            user[msg.sender].orders_array.push(total_orders);
            user[msg.sender].total_orders++;


            if(user[msg.sender].investBefore == false)
            { 
                total_users++;     
                user[msg.sender].investBefore=true;                                                  
            }


            if(_ref!=address(0) || _ref!=msg.sender)
            {
                
                user[msg.sender].referralFrom=_ref;
                user[_ref].Ref_earning+= (temp_amount * ref_percentage) / 100 ether;
                user[_ref].totalDirects++;

            }

            Token(usdt_address).transferFrom(msg.sender,address(this),amount);
            Token(DU_address).transfer(msg.sender,temp_amount);

            total_orders++;

        }

        function get_userSwaps()  public view returns(order_data[] memory order)
        {
            uint num = user[msg.sender].orders_array.length;

            order =  new order_data[](num) ;

            for(uint i=0;i<num;i++)
            {
                order[i] = orders[user[msg.sender].orders_array[i]];

            }

        }

        function get_All_PendingSwaps()  public view returns(order_data[] memory order)
        {
            uint num = pending_orders_arr.length;

            order =  new order_data[](num) ;

            for(uint i=0;i<num;i++)
            {
                order[i] = orders[pending_orders_arr[i]];
                order[i].index_no = i;

            }

        }
        function remove_pendingOrder(uint num) internal {
            require(num < pending_orders_arr.length) ;

            if(pending_orders_arr.length>1)
            {
                pending_orders_arr[num] = pending_orders_arr[pending_orders_arr.length-1];
            }

            pending_orders_arr.pop();
        }
        function respond_to_request(uint num,uint _decision,uint index_no)  public  returns(bool)
        {
            
            require(msg.sender==owner);
            require(orders[num].decision==0);
            require(_decision==1 || _decision==2);
            orders[num].orderEndTime=block.timestamp;
            orders[num].decision=_decision;



            if(_decision==1)
            {
                uint amount = orders[num].out_Amount;
                address tokenAddress = orders[num].out_TokenAddress;
                Token(tokenAddress).transfer(orders[num].userAddress,amount);

            }
            else if(_decision==2)
            {
                uint amount = orders[num].in_Amount;
                address tokenAddress = orders[num].in_TokenAddress;
                Token(tokenAddress).transfer(orders[num].userAddress,amount);

            }
            remove_pendingOrder(index_no);
            return true;

        }

        function withdraw_refEarning()  public
        {
            require(user[msg.sender].Ref_earning >= Minimum_withdraw_limit);

            Token(DU_address).transfer(msg.sender,user[msg.sender].Ref_earning);

        }



        //withdraw functions

        function withdrawdu(uint _amount)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            uint bal = Token(DU_address).balanceOf(address(this));
            require(bal>=_amount,"you dont have funds");

            Token(DU_address).transfer(owner,_amount); 
        }
        function withdrawUsdt(uint _amount)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            uint bal = Token(usdt_address).balanceOf(address(this));
            require(bal>=_amount,"you dont have funds");

            Token(usdt_address).transfer(owner,_amount); 
        }
               

        // update functions

        function transferOwnership(address _owner)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            owner = payable(_owner);
        }
        
        function update_Du_Price(uint val)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            Du_price_in_usdt = val;
        }

        function update_ref_percentage(uint val)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            ref_percentage = val;
        }
            
        function update_Minimum_withdraw_limit(uint val)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            Minimum_withdraw_limit = val;
        }     

        function update_fee(uint val)  public
        {
            require(msg.sender==owner,"only Owner can call this function");
            fee = val;
        } 
        


    } 