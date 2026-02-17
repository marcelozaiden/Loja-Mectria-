
import React from 'react';
import { Role, Product, User } from './types';

export const ADMIN_EMAIL = 'marcelo.zaiden@mectria.com';
export const TOKEN_RATE = 0.4; // 1h = 0.4 tokens

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Garrafa Mectria', price: 45, image: 'https://images.unsplash.com/photo-1602143399827-7211bf3a67d0?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Caderno Mectria', price: 27, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Caneta Mectria', price: 10, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Chaveiro Mectria', price: 5, image: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Adesivo Mectria', price: 5, image: 'https://images.unsplash.com/photo-1572375927502-1f237f11381c?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Açaí', price: 35, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=400' },
  { id: '7', name: 'Combo Punch', price: 35, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400' },
  { id: '8', name: 'Moletom Mectria', price: 80, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400' },
];

const generateMembers = (): User[] => {
  const memberData = [
    { name: "Arthur Menezes Jordão", email: "arthur.jordao@mectria.com" },
    { name: "Bruno Roberto Biancalana David Sandoval", email: "bruno.sandoval@mectria.com" },
    { name: "Cauã Sene Urzedo", email: "caua.urzedo@mectria.com" },
    { name: "Eduardo Fargnolli", email: "eduardo.fargnolli@mectria.com" },
    { name: "Gabriel Falcão de Araújo", email: "gabriel.falcao@mectria.com" },
    { name: "Henrique Vitorasso de Assis Oliveira", email: "henrique.vitorasso@mectria.com" },
    { name: "Iany Carvalho de Andrade", email: "iany.andrade@mectria.com" },
    { name: "Isabela da Cunha Aires", email: "isabela.aires@mectria.com" },
    { name: "João Gabriel Alves Rincon", email: "joao.rincon@mectria.com" },
    { name: "João Guilherme Freitas", email: "joao.freitas@mectria.com" },
    { name: "João Luiz Mateus de Lima", email: "joao.lima@mectria.com" },
    { name: "João Pedro Honorato Pinto Teixeira", email: "joao.teixeira@mectria.com" },
    { name: "João Vitor Ramos da Silveira", email: "joao.ramos@mectria.com" },
    { name: "José Eduardo dos Santos Araujo", email: "jose.araujo@mectria.com" },
    { name: "Léo Victor Quereguini", email: "leoquereguini@mectria.com" },
    { name: "Lucas Antônio Borella Gabriel de Oliveira", email: "lucas.oliveira@mectria.com" },
    { name: "Marcelo Lino Zaiden Casadio Gonçalves", email: "marcelo.zaiden@mectria.com" },
    { name: "Murilo Ceciliato Perão", email: "murilo.perao@mectria.com" },
    { name: "Pedro Henrique Grizzo E Silva", email: "pedro.grizzo@mectria.com" },
    { name: "Pedro Otávio Oliveira Lacerda", email: "pedro.lacerda@mectria.com" },
    { name: "Rafael Assis Lustosa", email: "rafael.lustosa@mectria.com" },
    { name: "Tulio Lima Prado", email: "tulio.prado@mectria.com" },
    { name: "Victor Hugo Lemos", email: "victor.lemos@mectria.com" },
    { name: "Victória Graça Baldoíno Pessoa", email: "victoria.pessoa@mectria.com" },
    { name: "Vinicius Fargnolli", email: "vinicius.fargnolli@mectria.com" },
    { name: "Vinícius da Silva Gomes", email: "vinicius.gomes@mectria.com" }
  ];

  return memberData.map((data, index) => {
    const isMarcelo = data.email === ADMIN_EMAIL;
    
    return {
      id: `m${index + 1}`,
      name: data.name,
      email: data.email,
      role: isMarcelo ? Role.ADMIN : Role.USER,
      clockifyId: data.name,
      balance: 0,
      avatar: `https://i.pravatar.cc/150?u=${index}`
    };
  });
};

export const INITIAL_MEMBERS: User[] = generateMembers();

export const GearLogo = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0L55 15L70 10L65 25L80 20L75 35L90 30L85 45L100 40L95 55L100 70L85 65L90 80L75 75L80 90L65 85L70 100L55 95L50 110V95L45 100L40 85L35 90L25 80L30 65L15 70L20 55L0 60L5 45L0 30L15 35L10 20L25 25L20 10L35 15L30 0L45 5L50 0Z" fill="#8B0000" />
    <circle cx="50" cy="50" r="25" fill="#f8fafc" />
    <path d="M50 35C41.7 35 35 41.7 35 50C35 58.3 41.7 65 50 65C58.3 65 65 58.3 65 50C65 41.7 58.3 35 50 35ZM50 58C45.6 58 42 54.4 42 50C42 45.6 45.6 42 50 42C54.4 42 58 45.6 58 50C58 54.4 54.4 58 50 58Z" fill="#334155" />
  </svg>
);
