import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import ProjectList from './components/ProjectList';
import ClientList from './components/ClientList';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Empleados ColumBito</h1>
          <nav>
            <ul>
              <li><a href="/">Empleados</a></li>
              <li><a href="/projects">Proyectos</a></li>
              <li><a href="/clients">Clientes</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeForm />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/clients" element={<ClientList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
