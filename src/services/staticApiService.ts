import { mockApi } from './mockApi';

const staticWriteError = () => new Error('Static example mode does not use a database connection.');

export const apiService = {
  async getProjects() {
    return mockApi.getProjects();
  },

  async getExperts() {
    return mockApi.getExperts();
  },

  async addProject() {
    throw staticWriteError();
  },

  async addExpert() {
    throw staticWriteError();
  },

  async addVolunteerSubscription() {
    throw staticWriteError();
  },

  async getProjectsMock() {
    return mockApi.getProjects();
  },

  async getExpertsMock() {
    return mockApi.getExperts();
  },
};

