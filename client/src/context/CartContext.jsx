import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { useProfile } from './UserContext';
import apiClient from '../services/apiClient';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        cartItems: action.payload,
        loading: false
      };
    case 'ADD_TO_CART':
      const item = action.payload;
      const existItem = state.cartItems.find((x) => 
        x.product === item.product && 
        JSON.stringify(x.customizations) === JSON.stringify(item.customizations)
      );

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            (x.product === existItem.product && JSON.stringify(x.customizations) === JSON.stringify(existItem.customizations)) ? item : x
          ),
        };
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        };
      }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cartItems: state.cartItems.filter((x) => 
          !(x.product === action.payload.product && JSON.stringify(x.customizations) === JSON.stringify(action.payload.customizations))
        ),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: [],
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { isSignedIn } = useProfile();
  const [state, dispatch] = useReducer(cartReducer, {
    cartItems: localStorage.getItem('cartItems')
      ? JSON.parse(localStorage.getItem('cartItems'))
      : [],
    loading: false
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
  }, [state.cartItems]);

  // Clear cart on sign-in or sign-out
  useEffect(() => {
    const resetCart = async () => {
      // 1. Clear local state
      dispatch({ type: 'CLEAR_CART' });
      
      // 2. Clear backend if we have a session
      if (isSignedIn) {
        try {
          await apiClient.delete('/cart');
        } catch (error) {
          console.error('Failed to clear backend cart on auth change', error);
        }
      }
    };

    resetCart();
  }, [isSignedIn]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
