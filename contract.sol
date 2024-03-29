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

            uint in_Amount;
            uint out_Amount;

            uint orderPlacingTime;
            uint decision;
            uint index_no;
            uint fee;

        }
        
        struct Data{

            bool investBefore;
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
        uint public total_orders;

        bool public initalized = false;


        address public owner;
        address public DU_address;
        address public usdt_address;
        uint public fee;
        
        uint Total_usdt_to_du;
        uint Total_du_to_usdt;

        uint public  baseVal_usdt_to_du;
        uint public baseVal_du_to_usdt;



    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner is allowed to perform this action");
        _;
    }      

        function initialize() public 
        {
            require(owner == address(0), "Already initalized");
            require(!initalized, "Already initalized");
            owner = msg.sender;
            DU_address=0xe298eD3543B45037A2D4037ac6dfeB2E801f9803;
            usdt_address=0x55d398326f99059fF775485246999027B3197955;
            Du_price_in_usdt = 0.07 ether;   
            ref_percentage= 1 ether;
            Minimum_withdraw_limit = 100 ether;
            fee=0.05 ether;
            baseVal_usdt_to_du=1000 ether;
            baseVal_du_to_usdt=100 ether;
            initalized = true;

        }
        

        function check_recieving_Amount( address add,uint amount) internal view returns(uint)
        {
            if(add==usdt_address)
            {
               return  (amount *1 ether)/ Du_price_in_usdt ;
            }
            else
            {
                return  (amount * Du_price_in_usdt)/1 ether;
            }

         }
        


        function du_to_usdt( uint amount, address _ref) external 
        {
            require(Token(DU_address).allowance(msg.sender,address(this))>=amount,"allowance issue");
            uint fee_temp = (amount * fee) / 100 ether;
            orders[total_orders].order_no = total_orders;
            orders[total_orders].fee = fee_temp;

            orders[total_orders].in_Amount=amount-fee_temp;
            orders[total_orders].userAddress=msg.sender;

            orders[total_orders].out_Amount = check_recieving_Amount(DU_address,amount-fee_temp);
            orders[total_orders].in_TokenAddress = DU_address;

            orders[total_orders].orderPlacingTime=block.timestamp;
            pending_orders_arr.push(total_orders);
            user[msg.sender].orders_array.push(total_orders);

            total_orders++;
            Total_du_to_usdt+=amount;
 

            if(_ref!=address(0) || _ref!=msg.sender)
            {
                
                user[_ref].Ref_earning+= (amount * ref_percentage) / 100 ether;
                user[_ref].totalDirects++;

            }
                
            Token(DU_address).transferFrom(msg.sender,address(this),amount);

        }






        function usdt_to_du(uint amount,address _ref) external 
        {
            require(Token(usdt_address).allowance(msg.sender,address(this))>=amount,"allowance issue");
            
            uint fee_temp = (amount * fee) / 100 ether;

            orders[total_orders].order_no=total_orders;
            orders[total_orders].fee = fee_temp;

            orders[total_orders].in_Amount=amount-fee_temp;
            orders[total_orders].userAddress=msg.sender;
            uint temp_amount=check_recieving_Amount(usdt_address,amount-fee_temp);
            orders[total_orders].out_Amount=temp_amount;
            orders[total_orders].in_TokenAddress=usdt_address;

            orders[total_orders].orderPlacingTime=block.timestamp;
            orders[total_orders].decision=1;                        
            user[msg.sender].orders_array.push(total_orders);
            Total_usdt_to_du+=amount;




            if(_ref!=address(0) || _ref!=msg.sender)
            {
                
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
        function respond_to_request(uint num,uint _decision,uint index_no) onlyOwner public  returns(bool)
        {

            require(orders[num].decision==0);
            require(_decision==1 || _decision==2);
            orders[num].decision=_decision;



            if(_decision==1)
            {
                uint amount = orders[num].out_Amount;
                address tokenAddress = orders[num].in_TokenAddress;
                if(tokenAddress==DU_address)
                {
                    Token(usdt_address).transfer(orders[num].userAddress,amount);

                }
                else if(tokenAddress==usdt_address)
                {
                    Token(DU_address).transfer(orders[num].userAddress,amount);

                }

            }
            else if(_decision==2)
            {
                uint amount = orders[num].in_Amount + orders[num].fee;
                address tokenAddress = orders[num].in_TokenAddress;
                Token(tokenAddress).transfer(orders[num].userAddress,amount);

            }
            remove_pendingOrder(index_no);
            return true;

        }

        function cancel_order(uint num,uint _decision,uint index_no)  public  returns(bool)
        {

            require(msg.sender==orders[num].userAddress);
            require(orders[num].decision==0 && orders[num].in_Amount>0);
            require(_decision==3);
            orders[num].decision=_decision;

            uint amount = orders[num].in_Amount + orders[num].fee;
            address tokenAddress = orders[num].in_TokenAddress;
            Token(tokenAddress).transfer(orders[num].userAddress,amount);

            
            remove_pendingOrder(index_no);
            return true;

        }
        function withdraw_refEarning()  public
        {
            require(user[msg.sender].Ref_earning >= Minimum_withdraw_limit);

            Token(DU_address).transfer(msg.sender,user[msg.sender].Ref_earning);

        }



        //withdraw functions

        function withdrawdu(uint _amount) onlyOwner public
        {
            uint bal = Token(DU_address).balanceOf(address(this));
            require(bal>=_amount,"you dont have funds");

            Token(DU_address).transfer(owner,_amount); 
        }
        function withdrawUsdt(uint _amount) onlyOwner  public
        {
            uint bal = Token(usdt_address).balanceOf(address(this));
            require(bal>=_amount,"you dont have funds");

            Token(usdt_address).transfer(owner,_amount); 
        }
               
        function get_usdt_to_du() public view returns(uint)
        {
            return baseVal_usdt_to_du + Total_usdt_to_du;
        } 
        
        function get_du_to_usdt()  public view returns(uint)
        {
            return baseVal_du_to_usdt + Total_du_to_usdt;
        } 
        

        // update functions

        function transferOwnership(address _owner) onlyOwner  public
        {
            owner = payable(_owner);
        }
        
        function update_Du_Price(uint val) onlyOwner public
        {
            Du_price_in_usdt = val;
        }

        function update_ref_percentage(uint val) onlyOwner  public
        {
            ref_percentage = val;
        }
            
        function update_Minimum_withdraw_limit(uint val) onlyOwner public
        {
            Minimum_withdraw_limit = val;
        }     

        function update_fee(uint val) onlyOwner public
        {
            fee = val;
        } 
        
        function update_baseVal_usdt_to_du(uint val) onlyOwner public
        {
            baseVal_usdt_to_du = val;
        } 
        
        function update_update_baseVal_du_to_usdt(uint val) onlyOwner public
        {
            baseVal_du_to_usdt = val;
        } 

        function updateCode(address newCode) onlyOwner public 
        {
            updateCodeAddress(newCode);
        }


    } 